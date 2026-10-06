import fs from "node:fs/promises";
import path from "node:path";
import { expireVideos } from "./files.mjs";

import { expireUploads } from "./uploads.mjs";
const portraitName = /^[a-f0-9]{64}\.(png|jpg|webp)$/;
export async function maintainStorage(store, directory, now = Date.now()) {
  await expireVideos(store, path.join(directory, "renders"), now);
  store.cleanupAuth();
  await expireUploads(store, directory, now);
  // Preserve every snapshot asset, including expired MP4s that can be rendered again.
  const referenced = new Set(
    store.db
      .prepare("SELECT filename FROM portrait_cache")
      .all()
      .map((row) => row.filename),
  );
  for (const { job } of store.db
    .prepare("SELECT job FROM snapshots")
    .iterate()) {
    for (const match of job.matchAll(
      /\/online-assets\/([a-f0-9]{64}\.(?:png|jpg|webp))/g,
    ))
      referenced.add(match[1]);
  }
  const assets = path.join(directory, "public", "online-assets");
  const files = await fs.readdir(assets).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  for (const file of files) {
    if (
      (!portraitName.test(file) && !/^[a-f0-9-]{36}\.tmp$/.test(file)) ||
      referenced.has(file)
    )
      continue;
    const filename = path.join(assets, file);
    const stat = await fs.lstat(filename);
    // Grace period protects in-flight preparations and recent, unused previews.
    if (stat.isFile() && stat.mtimeMs < now - 7 * 86400_000)
      await fs.unlink(filename);
  }
}
