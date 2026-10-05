import http from "node:http";
import path from "node:path";
import { fork } from "node:child_process";
import { randomUUID } from "node:crypto";
import { configuration, createAuth, cookies, cookie } from "./auth.mjs";
import { openStore } from "./store.mjs";
import { serveFile, removeVideos, expireVideos } from "./files.mjs";
import { f1SoundtrackPresets } from "../lib/f1-system.mjs";
import { projectRoot } from "../lib/video-system.mjs";
const config = configuration();
const store = openStore(process.env.APP_DATA_DIR);
const renders = path.join(process.env.APP_DATA_DIR, "renders");
const auth = createAuth(config, store);
const json = (res, status, data) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};
const log = (event, extra = {}) =>
  console.log(
    JSON.stringify({ timestamp: new Date().toISOString(), event, ...extra }),
  );
const page = (
  response,
  message = "Entre para criar e baixar seus Shorts.",
  status = 200,
) => {
  response.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rádio do Box · Entrar</title><style>body{background:#0f0f0f;color:white;font:18px system-ui;margin:0;padding:10vh 24px}main{max-width:480px;margin:auto;border-top:4px solid #e10600;padding-top:24px}a{display:inline-block;background:#e10600;color:white;padding:16px;text-decoration:none;margin-top:24px}</style><main><h1>RÁDIO DO BOX</h1><p>${message}</p><a href="/auth/google">Entrar com Google</a><p>Use o Safari ou Chrome se estiver no navegador interno de outro aplicativo.</p></main></html>`,
  );
};
async function bodyOf(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32768) throw new Error("body_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}
let preparing = false;
const preparationChildren = new Set();
function runPreparation(operation, body, requestId) {
  if (preparing) throw new Error("preparation_busy");
  preparing = true;
  log("preparation_started", { requestId, operation });
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = fork(new URL("./prepare.mjs", import.meta.url), [], {
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    preparationChildren.add(child);
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("preparation_timeout"));
    }, 120000);
    child.on("message", (message) => {
      if (message.ok) resolve(message.result);
      else reject(new Error(message.code));
    });
    child.on("error", () => reject(new Error("preparation_failed")));
    child.on("exit", () => {
      clearTimeout(timer);
      preparing = false;
      preparationChildren.delete(child);
      reject(new Error("preparation_failed"));
    });
    child.send({ operation, body });
  }).then(
    (result) => {
      log("preparation_completed", {
        requestId,
        durationMs: Date.now() - started,
      });
      return result;
    },
    (error) => {
      log("preparation_failed", {
        requestId,
        code: error.message,
        durationMs: Date.now() - started,
      });
      throw error;
    },
  );
}
const server = http.createServer(async (req, res) => {
  const requestId = randomUUID();
  res.setHeader("x-request-id", requestId);
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader(
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  try {
    const url = new URL(req.url, config.origin);
    const route = url.pathname;
    if (route === "/healthz" && ["GET", "HEAD"].includes(req.method))
      return json(res, 200, { ok: true });
    if (route === "/auth/google" && req.method === "GET")
      return await auth.start(res);
    if (route === "/auth/google/callback" && req.method === "GET") {
      try {
        await auth.callback(req, res, url);
      } catch (error) {
        log("login_failed", { requestId, code: error.code || error.name });
        page(
          res,
          `Não foi possível entrar. Verifique a conta permitida e tente novamente. Referência: ${requestId}`,
          401,
        );
      }
      return;
    }
    const session = auth.session(req);
    if (!session) {
      if (
        req.method === "GET" &&
        ["/", "/videos", "/settings", "/f1-sources", "/f1-sources/"].includes(
          route,
        )
      )
        return page(res);
      return json(res, 401, {
        error: "Entre com sua conta Google.",
        requestId,
      });
    }
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.headers.origin !== config.origin
    )
      return json(res, 403, { error: "Origem inválida.", requestId });
    if (req.method === "POST" && route === "/auth/logout") {
      store.revoke(cookies(req)["__Host-session"] || "");
      res.writeHead(303, {
        location: "/",
        "set-cookie": cookie("__Host-session", "", 0),
      });
      res.end();
      return;
    }
    if (req.method === "GET" && route === "/api/options")
      return json(res, 200, {
        soundtracks: f1SoundtrackPresets,
        email: session.email,
      });
    if (
      req.method === "GET" &&
      ["/api/events", "/api/editorial"].includes(route)
    )
      return json(res, 200, {
        result: await runPreparation(
          route.endsWith("events") ? "events" : "editorial",
          Object.fromEntries(url.searchParams),
          requestId,
        ),
      });
    if (req.method === "POST" && route === "/api/prepare") {
      const job = await runPreparation("prepare", await bodyOf(req), requestId);
      const id = store.snapshot(job);
      return json(res, 201, { id, job });
    }
    if (req.method === "GET" && route.startsWith("/api/snapshots/")) {
      const job = store.getSnapshot(route.split("/").at(-1));
      return json(res, job ? 200 : 404, { job });
    }
    if (req.method === "POST" && route === "/api/renders") {
      const body = await bodyOf(req);
      const id = store.enqueue(body.snapshot);
      log("render_queued", { renderId: id, requestId });
      return json(res, 202, { id });
    }
    if (req.method === "GET" && route === "/api/renders") {
      const rows = store.list();
      return json(res, 200, {
        renders: rows.map((row) => ({
          ...row,
          available: Boolean(row.available && row.expires > Date.now()),
        })),
        bytes: rows.reduce((sum, row) => sum + row.bytes, 0),
      });
    }
    if (req.method === "DELETE" && route === "/api/renders/completed") {
      const eligible = store
        .list()
        .filter((row) => row.status === "completed" && row.available);
      return json(res, 200, await removeVideos(store, renders, eligible));
    }
    const match =
      /^\/api\/renders\/([a-f0-9-]{36})(?:\/(cancel|retry|file))?$/.exec(route);
    if (match) {
      const row = store.get(match[1]);
      if (!row) return json(res, 404, { error: "Vídeo não encontrado." });
      if (req.method === "POST" && match[2] === "cancel") {
        store.cancel(row.id);
        log("render_cancelled", { renderId: row.id, requestId });
        return json(res, 200, { ok: true });
      }
      if (req.method === "POST" && match[2] === "retry") {
        const id = store.enqueue(row.snapshot);
        log("render_queued", { renderId: id, requestId });
        return json(res, 202, { id });
      }
      if (req.method === "DELETE" && !match[2])
        return json(res, 200, await removeVideos(store, renders, [row]));
      if (["GET", "HEAD"].includes(req.method) && match[2] === "file") {
        if (
          !row.available ||
          row.status !== "completed" ||
          row.expires <= Date.now()
        )
          return json(res, 410, {
            error: "MP4 indisponível. Você pode gerar novamente.",
          });
        if (url.searchParams.has("download"))
          res.setHeader(
            "content-disposition",
            `attachment; filename="radio-do-box-${row.id}.mp4"`,
          );
        return await serveFile(req, res, renders, `${row.id}.mp4`);
      }
    }
    if (["GET", "HEAD"].includes(req.method)) {
      if (
        ["/", "/videos", "/settings", "/f1-sources", "/f1-sources/"].includes(
          route,
        )
      )
        return await serveFile(
          req,
          res,
          path.join(projectRoot, "dashboard/online"),
          "index.html",
        );
      if (["/app.js", "/style.css"].includes(route))
        return await serveFile(
          req,
          res,
          path.join(projectRoot, "dashboard/online"),
          route.slice(1),
        );
      if (route === "/player.js")
        return await serveFile(
          req,
          res,
          path.join(projectRoot, "build/online"),
          "player.js",
        );
      if (route.startsWith("/public/online-assets/"))
        return await serveFile(
          req,
          res,
          path.join(process.env.APP_DATA_DIR, "public", "online-assets"),
          decodeURIComponent(route.slice("/public/online-assets/".length)),
        );
      if (route.startsWith("/public/"))
        return await serveFile(
          req,
          res,
          path.join(projectRoot, "build/renderer/public"),
          decodeURIComponent(route.slice(8)),
        );
    }
    json(res, 404, { error: "Página não encontrada." });
  } catch (error) {
    log("request_failed", {
      requestId,
      code: /^[a-z_]+$/.test(error.message) ? error.message : "internal_error",
      errorType: error.name,
    });
    if (res.headersSent) {
      res.destroy();
      return;
    }
    const busy = ["queue_full", "preparation_busy"].includes(error.message);
    json(res, busy ? 429 : 400, {
      error: busy
        ? "Há um trabalho em andamento ou a fila está cheia. Tente novamente em instantes."
        : "Não foi possível concluir. Verifique a seleção e se a fonte já publicou os dados.",
      requestId,
    });
  }
});
server.requestTimeout = 150000;
server.headersTimeout = 15000;
const cleanup = setInterval(() => {
  store.cleanupAuth();
  expireVideos(store, renders).catch(() => log("cleanup_failed"));
}, 3600_000);
server.listen(Number(process.env.PORT || 4321), "0.0.0.0", () =>
  log("http_ready"),
);
process.on("SIGTERM", () => {
  clearInterval(cleanup);
  for (const child of preparationChildren) child.kill("SIGKILL");
  server.close(() => {
    store.db.close();
    process.exit(0);
  });
  server.closeIdleConnections();
});
