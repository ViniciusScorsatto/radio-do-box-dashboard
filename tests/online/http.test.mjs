import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { fork } from "node:child_process";
import { once } from "node:events";
import { openStore } from "../../scripts/online/store.mjs";
async function port() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return value;
}
test("HTTP auth wall, direct login, CSRF, queue, streaming, logout and expiry", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-http-"));
  await fs.mkdir(path.join(directory, "renders"));
  const store = openStore(directory);
  store.addSession("test-session", "a@example.com");
  const number = await port();
  const origin = "https://example.com";
  const child = fork(
    new URL("../../scripts/online/http.mjs", import.meta.url),
    [],
    {
      env: {
        ...process.env,
        APP_ONLINE: "true",
        APP_DATA_DIR: directory,
        PUBLIC_URL: origin,
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        ALLOWED_EMAILS: "a@example.com,b@example.com",
        PORT: String(number),
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  t.after(async () => {
    child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
    store.db.close();
    await fs.rm(directory, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server_timeout")), 10000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("http_ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("server_exit"));
    });
  });
  const base = `http://127.0.0.1:${number}`;
  const headers = { cookie: "__Host-session=test-session", origin };
  for (const route of ["/", "/videos", "/settings", "/f1-sources"]) {
    const r = await fetch(base + route);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Entrar com Google/);
  }
  for (const route of [
    "/api/options",
    "/api/renders",
    "/public/fonts/radio-do-box/Inter-Bold.ttf",
    "/player.js",
  ])
    assert.equal((await fetch(base + route)).status, 401);
  assert.equal((await fetch(base + "/healthz")).status, 200);
  assert.equal(
    (await fetch(base + "/auth/google/callback?code=invalid&state=invalid"))
      .status,
    401,
  );
  assert.equal((await fetch(base + "/api/options", { headers })).status, 200);
  assert.equal(
    (
      await fetch(base + "/api/renders", {
        method: "POST",
        headers: { cookie: headers.cookie, origin: "https://evil.example" },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/f1/jobs/render", {
        method: "POST",
        headers,
        body: "{}",
      })
    ).status,
    404,
  );
  const snapshot = store.snapshot({ title: "Test", template: "race-results" });
  const queued = await fetch(base + "/api/renders", {
    method: "POST",
    headers,
    body: JSON.stringify({ snapshot }),
  });
  assert.equal(queued.status, 202);
  const { id } = await queued.json();
  store.claim();
  store.finish(id, 10);
  await fs.writeFile(
    path.join(directory, "renders", id + ".mp4"),
    "0123456789",
  );
  const file = base + `/api/renders/${id}/file`;
  assert.equal((await fetch(file)).status, 401);
  const range = await fetch(file, {
    headers: { ...headers, range: "bytes=2-5" },
  });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await range.text(), "2345");
  const head = await fetch(file, { method: "HEAD", headers });
  assert.equal(head.headers.get("content-length"), "10");
  assert.equal(await head.text(), "");
  assert.equal(
    (await fetch(file, { headers: { ...headers, range: "bytes=20-" } })).status,
    416,
  );
  store.db.prepare("UPDATE renders SET expires=0 WHERE id=?").run(id);
  assert.equal((await fetch(file, { headers })).status, 410);
  const logout = await fetch(base + "/auth/logout", {
    method: "POST",
    headers,
    redirect: "manual",
  });
  assert.equal(logout.status, 303);
  assert.equal((await fetch(base + "/api/renders", { headers })).status, 401);
});
