import fs from "node:fs/promises";
import { readdirSync, lstatSync } from "node:fs";
let reservedBytes = 0;
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

// Stock portraits are immutable snapshot assets, stored on the Railway volume.
export async function persistOnlinePortrait(value) {
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
  if (!process.env.APP_DATA_DIR || !path.isAbsolute(process.env.APP_DATA_DIR))
    throw new Error("missing_data_directory");
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
