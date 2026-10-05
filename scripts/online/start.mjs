import { fork } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { configuration } from "./auth.mjs";
import { openStore } from "./store.mjs";
import { maintainStorage } from "./maintenance.mjs";
import { childEnvironment } from "./security.mjs";
import { initializeRuntime } from "./runtime.mjs";
initializeRuntime();
configuration();
process.env.APP_ONLINE = "true";
const directory = process.env.APP_DATA_DIR;
for (const name of ["renders", "tmp", "generated"])
  await fs.mkdir(path.join(directory, name), { recursive: true });
// Only this supervisor owns these upload temporaries; no worker is started yet.
for (const file of await fs.readdir(path.join(directory, "tmp"))) {
  if (/^[a-f0-9-]{36}\.(upload|png)$/.test(file))
    await fs.rm(path.join(directory, "tmp", file), { force: true });
}
const store = openStore(directory);
store.recover();
store.cleanupAuth();
for (const file of await fs.readdir(path.join(directory, "renders"))) {
  const id = file.replace(/\.mp4$/, "");
  if (
    file.endsWith(".partial.mp4") ||
    (/^[a-f0-9-]+\.mp4$/.test(file) && !store.get(id)?.available)
  )
    await fs.unlink(path.join(directory, "renders", file));
}
await maintainStorage(store, directory);
store.db.close();
const children = [];
let shutting = false;
function stop(code) {
  if (shutting) return;
  shutting = true;
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "shutdown",
      code,
    }),
  );
  for (const child of children) child.kill("SIGTERM");
  const timer = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
    process.exit(code);
  }, 15000);
  Promise.all(
    children.map((child) =>
      child.exitCode !== null || child.signalCode
        ? Promise.resolve()
        : new Promise((resolve) => child.once("exit", resolve)),
    ),
  ).then(() => {
    clearTimeout(timer);
    process.exit(code);
  });
}
function launch(file) {
  const child = fork(new URL(file, import.meta.url), [], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    env: file === "./worker.mjs" ? childEnvironment() : process.env,
  });
  children.push(child);
  child.on("error", () => stop(1));
  child.on("exit", () => {
    if (!shutting) stop(1);
  });
  return child;
}
const worker = launch("./worker.mjs");
const startup = setTimeout(() => stop(1), 60000);
worker.once("message", () => {
  clearTimeout(startup);
  launch("./http.mjs");
});
process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));
