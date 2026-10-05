import fs from "node:fs";
import path from "node:path";

// Railway mounts existing volumes as root. Repair only /data, then permanently
// drop privileges before opening SQLite, starting HTTP, or launching Chrome.
export function initializeRuntime() {
  process.umask(0o077);
  if (process.platform !== "linux" || process.getuid() !== 0) return;
  if (process.env.APP_DATA_DIR !== "/data")
    throw new Error("root_bootstrap_requires_data_volume");
  fs.mkdirSync("/data", { recursive: true });
  if (fs.realpathSync("/data") !== "/data")
    throw new Error("unsafe_data_directory");
  const device = fs.lstatSync("/data").dev;
  function own(file) {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || stat.dev !== device) return;
    if (stat.isDirectory())
      for (const child of fs.readdirSync(file)) own(path.join(file, child));
    fs.chownSync(file, 1000, 1000);
  }
  own("/data");
  fs.chmodSync("/data", 0o700);
  process.setgroups([]);
  process.setgid(1000);
  process.setuid(1000);
  process.env.HOME = "/home/node";
  if (process.getuid() === 0) throw new Error("privilege_drop_failed");
}
