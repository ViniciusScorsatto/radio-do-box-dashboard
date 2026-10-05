import { statfsSync } from "node:fs";

// Renderers and source collectors do not need OAuth or deployment credentials.
export function childEnvironment(env = process.env) {
  const allowed = [
    "PATH",
    "HOME",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "NODE_ENV",
    "APP_ONLINE",
    "APP_DATA_DIR",
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => env[key] !== undefined)
      .map((key) => [key, env[key]]),
  );
}

export function requireDiskSpace(directory) {
  const { bavail, bsize } = statfsSync(directory);
  if (bavail * bsize < 512 * 1024 * 1024) throw new Error("storage_low");
}
