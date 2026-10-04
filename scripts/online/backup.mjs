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
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.env.APP_DATA_DIR || !process.argv[2])
    throw new Error(
      "Usage: APP_DATA_DIR=/data node scripts/online/backup.mjs /private/destination.sqlite",
    );
  await backupDatabase(
    path.join(process.env.APP_DATA_DIR, "app.sqlite"),
    process.argv[2],
  );
  console.log(
    "Consistent SQLite backup completed. Copy to private external storage.",
  );
}
