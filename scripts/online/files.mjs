import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
export async function safePath(root, relative) {
  const base = await fs.realpath(root);
  const file = await fs.realpath(path.resolve(base, relative));
  if (!file.startsWith(base + path.sep)) throw new Error("path_denied");
  return file;
}
export function byteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || !size || (!match[1] && !match[2])) throw new Error("range");
  let start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  let end =
    match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start > end ||
    start >= size
  )
    throw new Error("range");
  return { start, end };
}
export async function serveFile(request, response, root, relative) {
  let file, stat;
  try {
    file = await safePath(root, relative);
    stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error("not_file");
  } catch {
    response.writeHead(404);
    response.end();
    return;
  }
  let range;
  try {
    range = byteRange(request.headers.range, stat.size);
  } catch {
    response.writeHead(416, { "content-range": `bytes */${stat.size}` });
    response.end();
    return;
  }
  response.writeHead(range ? 206 : 200, {
    "content-type": types[path.extname(file)] || "application/octet-stream",
    "accept-ranges": "bytes",
    "content-length": range ? range.end - range.start + 1 : stat.size,
    ...(range
      ? { "content-range": `bytes ${range.start}-${range.end}/${stat.size}` }
      : {}),
  });
  if (request.method === "HEAD") return response.end();
  const stream = createReadStream(file, range || {});
  stream.on("error", () => response.destroy());
  response.on("close", () => stream.destroy());
  stream.pipe(response);
}
export async function removeVideos(store, directory, rows) {
  let removed = 0,
    bytes = 0;
  const failed = [];
  for (const row of rows) {
    if (row.status !== "completed" || !row.available) continue;
    try {
      await fs.unlink(path.join(directory, `${row.id}.mp4`));
    } catch (error) {
      if (error.code !== "ENOENT") {
        failed.push(row.id);
        continue;
      }
    }
    const changed = store.db
      .prepare(
        "UPDATE renders SET available=0,bytes=0 WHERE id=? AND available=1",
      )
      .run(row.id).changes;
    if (changed) {
      removed++;
      bytes += row.bytes;
    }
  }
  return { removed, bytes, failed };
}
export async function expireVideos(store, directory, now = Date.now()) {
  return removeVideos(
    store,
    directory,
    store.list().filter((row) => row.available && row.expires <= now),
  );
}
