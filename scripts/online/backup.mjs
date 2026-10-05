import { DatabaseSync, backup } from "node:sqlite";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
export async function backupDatabase(source, destination) {
  const absolute = path.resolve(destination);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  try {
    await fs.access(absolute);
    throw new Error("Backup destination already exists");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const db = new DatabaseSync(source, { readOnly: true });
  try {
    await backup(db, absolute);
  } finally {
    db.close();
  }
  await fs.chmod(absolute, 0o600);
}
export async function backupOnline(directory, destination) {
  const assetDestination = path.resolve(destination) + ".assets";
  try {
    await fs.access(assetDestination);
    throw new Error("Asset backup destination already exists");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await backupDatabase(path.join(directory, "app.sqlite"), destination);
  await fs.mkdir(assetDestination, { mode: 0o700 });
  const assets = path.join(directory, "public", "online-assets");
  let files;
  try {
    files = await fs.readdir(assets);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    files = [];
  }
  // Images are immutable and are written before the snapshot, so copying after the DB is safe.
  for (const file of files) {
    if (/^[a-f0-9]{64}\.(png|jpg|webp)$/.test(file))
      await fs.copyFile(
        path.join(assets, file),
        path.join(assetDestination, file),
      );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.env.APP_DATA_DIR || !process.argv[2])
    throw new Error(
      "Usage: APP_DATA_DIR=/data node scripts/online/backup.mjs /private/destination.sqlite",
    );
  await backupOnline(process.env.APP_DATA_DIR, process.argv[2]);
  console.log(
    "SQLite and portrait backup completed. Copy both the .sqlite file and .sqlite.assets directory to private external storage.",
  );
}
