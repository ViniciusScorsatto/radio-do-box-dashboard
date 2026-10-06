import fs from "node:fs/promises";
import { readdirSync, lstatSync } from "node:fs";
let reservedBytes = 0;
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const pending = new Map();
const portraitName = /^[a-f0-9]{64}\.(png|jpg|webp)$/;

// Cache by selected championship season and source, independently of wall-clock time.
// Dynamic import keeps the local Node 20 workflow free of node:sqlite.
export async function persistOnlinePortrait(value, { category, season } = {}) {
  validateUrl(value);
  if (
    !["stock-pro", "stock-light"].includes(category) ||
    !Number.isInteger(Number(season)) ||
    Number(season) < 1950 ||
    Number(season) > 2100
  )
    throw new Error("invalid_portrait_season");
  const directory = process.env.APP_DATA_DIR;
  if (!directory || !path.isAbsolute(directory))
    throw new Error("missing_data_directory");
  const key = createHash("sha256")
    .update(JSON.stringify([category, Number(season), new URL(value).href]))
    .digest("hex");
  const pendingKey = `${directory}:${key}`;
  if (pending.has(pendingKey)) return pending.get(pendingKey);
  const operation = (async () => {
    const { openStore } = await import("../online/store.mjs");
    const store = openStore(directory);
    try {
      const cached = store.db
        .prepare("SELECT filename FROM portrait_cache WHERE cache_key=?")
        .get(key);
      if (cached && portraitName.test(cached.filename)) {
        const stat = await fs
          .lstat(
            path.join(directory, "public", "online-assets", cached.filename),
          )
          .catch((error) => {
            if (error.code === "ENOENT") return null;
            throw error;
          });
        if (stat?.isFile() && stat.size > 0)
          return `/online-assets/${cached.filename}`;
      }
      if (
        !cached &&
        store.db.prepare("SELECT count(*) n FROM portrait_cache").get().n >=
          10000
      )
        throw new Error("portrait_cache_quota");
      const asset = await downloadPortrait(value);
      store.db
        .prepare(
          "INSERT OR REPLACE INTO portrait_cache (cache_key,filename) VALUES (?,?)",
        )
        .run(key, path.basename(asset));
      return asset;
    } finally {
      store.db.close();
    }
  })();
  pending.set(pendingKey, operation);
  try {
    return await operation;
  } finally {
    pending.delete(pendingKey);
  }
}

function validateUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.paddockfan.com.br" ||
    !["", "9091"].includes(url.port) ||
    url.username ||
    url.password ||
    !/^\/simetraapppaddockfan\/imagens\//i.test(url.pathname)
  )
    throw new Error("invalid_portrait_url");
}

// Files remain content-addressed so a new season cannot alter old snapshots.
async function downloadPortrait(value) {
  const url = new URL(value);
  const response = await fetch(url.href, {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("portrait_unavailable");
  const limit = 8 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("portrait_too_large");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("portrait_too_large");
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const extension = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? ".png"
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? ".jpg"
      : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP"
        ? ".webp"
        : null;
  if (!extension) throw new Error("invalid_portrait_image");
  const filename = createHash("sha256").update(bytes).digest("hex") + extension;
  const directory = path.join(
    process.env.APP_DATA_DIR,
    "public",
    "online-assets",
  );
  await fs.mkdir(directory, { recursive: true });
  const destination = path.join(directory, filename);
  try {
    await fs.access(destination);
  } catch {
    // Reservations include concurrent downloads in this single preparation process.
    const used = readdirSync(directory).reduce((sum, name) => {
      const stat = lstatSync(path.join(directory, name));
      return sum + (stat.isFile() ? stat.size : 0);
    }, 0);
    if (used + reservedBytes + bytes.length > 512 * 1024 * 1024)
      throw new Error("portrait_storage_quota");
    reservedBytes += bytes.length;
    const temporary = path.join(directory, `${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, bytes);
      await fs.rename(temporary, destination);
    } finally {
      reservedBytes -= bytes.length;
      await fs.rm(temporary, { force: true });
    }
  }
  return `/online-assets/${filename}`;
}
