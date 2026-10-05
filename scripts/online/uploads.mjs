import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fork } from "node:child_process";
import { childEnvironment, requireDiskSpace } from "./security.mjs";
import { f1SoundtrackPresets } from "../lib/f1-system.mjs";
export const uploadRetention = 48 * 3600_000;
export const uploadLimit = 8 * 1024 * 1024;
export async function acceptImage(req, store, directory) {
  if (!["image/png", "image/jpeg"].includes(req.headers["content-type"]))
    throw new Error("invalid_image");
  if (Number(req.headers["content-length"]) > uploadLimit)
    throw new Error("image_too_large");
  requireDiskSpace(directory);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > uploadLimit) throw new Error("image_too_large");
    chunks.push(chunk);
  }
  const tmp = path.join(directory, "tmp");
  await fs.mkdir(tmp, { recursive: true });
  const stem = randomUUID();
  const input = path.join(tmp, `${stem}.upload`),
    output = path.join(tmp, `${stem}.png`);
  try {
    await fs.writeFile(input, Buffer.concat(chunks), {
      flag: "wx",
      mode: 0o600,
    });
    await new Promise((resolve, reject) => {
      const child = fork(
        new URL("./normalize-image.mjs", import.meta.url),
        [],
        {
          env: childEnvironment(),
          execArgv: ["--max-old-space-size=192"],
          stdio: ["ignore", "ignore", "ignore", "ipc"],
        },
      );
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, 15000);
      let result;
      child.on("message", (message) => {
        result = message;
      });
      child.on("error", () => {
        clearTimeout(timer);
        reject(new Error("invalid_image"));
      });
      child.on("exit", () => {
        clearTimeout(timer);
        result?.ok && !timedOut
          ? resolve()
          : reject(
              new Error(
                timedOut ? "image_timeout" : result?.code || "invalid_image",
              ),
            );
      });
      child.send({ input, output });
    });
    const bytes = await fs.readFile(output);
    const id = createHash("sha256").update(bytes).digest("hex");
    const used = store.db
      .prepare("SELECT coalesce(sum(bytes),0) bytes FROM uploads WHERE id != ?")
      .get(id).bytes;
    if (used + bytes.length > 200 * 1024 * 1024)
      throw new Error("upload_storage_quota");
    const assets = path.join(directory, "uploads");
    await fs.mkdir(assets, { recursive: true });
    await fs.rename(output, path.join(assets, `${id}.png`));
    store.db
      .prepare(
        "INSERT INTO uploads VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET expires=excluded.expires",
      )
      .run(id, bytes.length, Date.now() + uploadRetention);
    return {
      id,
      path: `/uploads/${id}.png`,
      expires: Date.now() + uploadRetention,
    };
  } finally {
    await fs.rm(input, { force: true });
    await fs.rm(output, { force: true });
  }
}
export function prepareImages(body, store) {
  if (
    !["single", "sequence"].includes(body.mode) ||
    !Array.isArray(body.images) ||
    body.images.length < 1 ||
    body.images.length > 5 ||
    (body.mode === "single" && body.images.length !== 1) ||
    (body.mode === "sequence" && body.images.length < 2)
  )
    throw new Error("invalid_image_sequence");
  const images = body.images.map((item) => {
    if (!item || typeof item.id !== "string" || !/^[a-f0-9]{64}$/.test(item.id))
      throw new Error("invalid_image");
    const seconds = body.mode === "single" ? 12 : Number(item.seconds);
    // Whole seconds keep editing predictable and frame boundaries exact.
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 60)
      throw new Error("invalid_image_duration");
    return {
      id: item.id,
      path: `/uploads/${item.id}.png`,
      durationInFrames: seconds * 30,
    };
  });
  const durationInFrames = images.reduce(
    (sum, item) => sum + item.durationInFrames,
    0,
  );
  if (durationInFrames > 1800) throw new Error("image_duration_limit");
  const soundtrackPath = body.soundtrackPath || f1SoundtrackPresets[0]?.value;
  if (!f1SoundtrackPresets.some((item) => item.value === soundtrackPath))
    throw new Error("invalid_soundtrack");
  const soundtrackVolume = Number(body.soundtrackVolume ?? 0.2);
  if (
    !Number.isFinite(soundtrackVolume) ||
    soundtrackVolume < 0 ||
    soundtrackVolume > 1
  )
    throw new Error("invalid_volume");
  const job = {
    template: "uploaded-images",
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 160)
        : "Short com imagens",
    images,
    durationInFrames,
    soundtrackPath,
    soundtrackVolume,
  };
  store.requireUploads(job);
  return job;
}
export async function expireUploads(store, directory, now = Date.now()) {
  const active = new Set();
  for (const { job } of store.db
    .prepare(
      "SELECT snapshots.job FROM renders JOIN snapshots ON snapshots.id=renders.snapshot WHERE status IN ('queued','rendering')",
    )
    .all()) {
    const parsed = JSON.parse(job);
    if (parsed.template === "uploaded-images")
      for (const image of parsed.images) active.add(image.id);
  }
  for (const row of store.db
    .prepare("SELECT id FROM uploads WHERE expires<=?")
    .all(now)) {
    if (active.has(row.id)) continue;
    await fs.rm(path.join(directory, "uploads", `${row.id}.png`), {
      force: true,
    });
    store.db.prepare("DELETE FROM uploads WHERE id=?").run(row.id);
  }
  // Recover files left by a crash between rename and database registration.
  for (const name of await fs
    .readdir(path.join(directory, "uploads"))
    .catch((e) => {
      if (e.code === "ENOENT") return [];
      throw e;
    })) {
    if (
      !/^[a-f0-9]{64}\.png$/.test(name) ||
      store.db
        .prepare("SELECT id FROM uploads WHERE id=?")
        .get(name.slice(0, -4))
    )
      continue;
    const file = path.join(directory, "uploads", name);
    if ((await fs.lstat(file)).mtimeMs < now - uploadRetention)
      await fs.unlink(file);
  }
}
