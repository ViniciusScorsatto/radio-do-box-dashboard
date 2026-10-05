import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {
  renderMedia,
  selectComposition,
  makeCancelSignal,
} from "@remotion/renderer";
import { openStore } from "./store.mjs";
import { serveFile } from "./files.mjs";
import { safeDiagnostic } from "./logging.mjs";
import { projectRoot } from "../lib/video-system.mjs";
import { requireDiskSpace } from "./security.mjs";
const directory = process.env.APP_DATA_DIR;
const store = openStore(directory);
const renders = path.join(directory, "renders");
let stopping = false;
let activeCancel;
const log = (event, extra = {}) =>
  console.log(
    JSON.stringify({ timestamp: new Date().toISOString(), event, ...extra }),
  );
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const relative =
      decodeURIComponent(url.pathname).replace(/^\//, "") || "index.html";
    const upload = relative.startsWith("public/uploads/");
    const portrait = relative.startsWith("public/online-assets/");
    await serveFile(
      req,
      res,
      upload
        ? path.join(directory, "uploads")
        : portrait
          ? path.join(directory, "public", "online-assets")
          : path.join(projectRoot, "build/renderer"),
      upload
        ? relative.slice("public/uploads/".length)
        : portrait
          ? relative.slice("public/online-assets/".length)
          : relative,
    );
  } catch {
    if (res.headersSent) res.destroy();
    else {
      res.writeHead(400);
      res.end();
    }
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serveUrl = `http://127.0.0.1:${server.address().port}`;
process.send?.({ ready: true });
log("worker_ready");
process.on("SIGTERM", () => {
  stopping = true;
  activeCancel?.();
});
process.on("SIGINT", () => {
  stopping = true;
  activeCancel?.();
});
while (!stopping) {
  const row = store.claim();
  if (!row) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    continue;
  }
  const started = Date.now();
  const partial = path.join(renders, `${row.id}.partial.mp4`);
  const final = path.join(renders, `${row.id}.mp4`);
  const { cancel, cancelSignal } = makeCancelSignal();
  activeCancel = cancel;
  let timedOut = false;
  let renderDone = false;
  let stage = "select_composition";
  const timeout = setTimeout(() => {
    timedOut = true;
    cancel();
  }, 30 * 60_000);
  // selectComposition has no cancelSignal. Terminate the worker if browser startup hangs.
  const hardTimeout = setTimeout(() => process.exit(1), 31 * 60_000);
  const monitor = setInterval(() => {
    if (store.get(row.id)?.status === "cancelled") cancel();
  }, 500);
  log("render_started", { renderId: row.id });
  try {
    requireDiskSpace(directory);
    const inputProps = { job: store.getSnapshot(row.snapshot) };
    const composition = await selectComposition({
      serveUrl,
      id: "OnlineShort",
      inputProps,
    });
    if (timedOut || stopping || store.get(row.id)?.status === "cancelled")
      throw new Error("cancelled");
    stage = "render_media";
    let lastProgress = 0;
    await renderMedia({
      composition,
      serveUrl,
      inputProps,
      outputLocation: partial,
      codec: "h264",
      audioCodec: "aac",
      pixelFormat: "yuv420p",
      concurrency: 1,
      cancelSignal,
      onProgress: ({ progress }) => {
        if (Date.now() - lastProgress > 1000) {
          store.progress(row.id, progress);
          lastProgress = Date.now();
        }
      },
    });
    if (timedOut || stopping || store.get(row.id)?.status !== "rendering")
      throw new Error("cancelled");
    await fs.rename(partial, final);
    renderDone = Boolean(store.finish(row.id, (await fs.stat(final)).size));
    if (!renderDone) await fs.rm(final, { force: true });
    log(renderDone ? "render_completed" : "render_cancelled", {
      renderId: row.id,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const code = timedOut
      ? "render_timeout"
      : stopping
        ? "interrupted"
        : "render_failed";
    store.fail(row.id, code);
    log("render_stopped", {
      renderId: row.id,
      status: store.get(row.id)?.status,
      code,
      ...safeDiagnostic(error, stage),
      durationMs: Date.now() - started,
    });
  } finally {
    clearInterval(monitor);
    clearTimeout(timeout);
    clearTimeout(hardTimeout);
    activeCancel = null;
    await fs.rm(partial, { force: true });
    if (!renderDone) await fs.rm(final, { force: true });
  }
}
server.close();
store.db.close();
process.exit(0);
