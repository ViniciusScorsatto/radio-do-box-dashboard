import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore, retentionMs } from "../../scripts/online/store.mjs";
import {
  configuration,
  authorizedClaims,
  cookie,
} from "../../scripts/online/auth.mjs";
import {
  byteRange,
  safePath,
  expireVideos,
  removeVideos,
} from "../../scripts/online/files.mjs";
import { backupDatabase } from "../../scripts/online/backup.mjs";
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-online-"));
  const store = openStore(dir);
  t.after(async () => {
    store.db.close();
    await fs.rm(dir, { recursive: true, force: true });
  });
  return { dir, store };
}
test("immutable snapshots, FIFO queue, restart, cancellation and retry", async (t) => {
  const { dir, store } = await fixture(t);
  const job = { title: "Original" };
  const snapshot = store.snapshot(job);
  job.title = "Changed";
  assert.equal(store.getSnapshot(snapshot).title, "Original");
  const first = store.enqueue(snapshot);
  const second = store.enqueue(snapshot);
  assert.equal(store.claim().id, first);
  store.recover();
  assert.equal(store.get(first).status, "failed");
  assert.equal(store.get(second).status, "queued");
  store.cancel(second);
  assert.equal(store.claim(), undefined);
  const retry = store.enqueue(snapshot);
  assert.equal(store.claim().id, retry);
  store.cancel(retry);
  assert.equal(store.finish(retry, 100), 0);
  const reopened = openStore(dir);
  assert.equal(reopened.getSnapshot(snapshot).title, "Original");
  reopened.db.close();
});
test("queue bound rejects the 21st active job", async (t) => {
  const { store } = await fixture(t);
  const snapshot = store.snapshot({});
  for (let i = 0; i < 20; i++) store.enqueue(snapshot);
  assert.throws(() => store.enqueue(snapshot), /queue_full/);
});
test("sessions expire and revoke; OAuth state is single-use", async (t) => {
  const { store } = await fixture(t);
  store.addSession("secret", "a@example.com", 1000);
  assert.equal(store.session("secret", 1001).email, "a@example.com");
  assert.equal(store.session("secret", 1000 + 7 * 86400_000), undefined);
  assert.notEqual(
    store.db.prepare("SELECT id FROM sessions").get().id,
    "secret",
  );
  store.revoke("secret");
  assert.equal(store.session("secret", 1001), undefined);
  store.addOAuth("binding", { state: "state" });
  assert.equal(store.consumeOAuth("wrong"), null);
  assert.equal(store.consumeOAuth("binding").state, "state");
  assert.equal(store.consumeOAuth("binding"), null);
});
test("two verified Google accounts only and fail-closed production config", () => {
  const env = {
    PUBLIC_URL: "https://example.com",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret",
    ALLOWED_EMAILS: "a@example.com,b@example.com",
    APP_DATA_DIR: "/data",
  };
  const config = configuration(env);
  assert(
    authorizedClaims(
      { email: "A@example.com", email_verified: true },
      config.emails,
    ),
  );
  assert(
    !authorizedClaims(
      { email: "c@example.com", email_verified: true },
      config.emails,
    ),
  );
  assert(
    !authorizedClaims(
      { email: "a@example.com", email_verified: false },
      config.emails,
    ),
  );
  assert(
    !authorizedClaims(
      { email: "a@example.com", email_verified: "true" },
      config.emails,
    ),
  );
  assert.throws(() =>
    configuration({ ...env, PUBLIC_URL: "http://example.com" }),
  );
  assert.throws(() =>
    configuration({ ...env, ALLOWED_EMAILS: "a@x.com,b@x.com,c@x.com" }),
  );
  assert.match(
    cookie("__Host-session", "value", 60),
    /HttpOnly; Secure; SameSite=Lax/,
  );
});
test("byte ranges and symlink/traversal rejection", async (t) => {
  assert.deepEqual(byteRange("bytes=2-5", 10), { start: 2, end: 5 });
  assert.deepEqual(byteRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(byteRange("bytes=8-", 10), { start: 8, end: 9 });
  for (const range of [
    "bytes=10-",
    "bytes=5-2",
    "bytes=-0",
    "bytes=0-1,4-5",
    "nonsense",
  ])
    assert.throws(() => byteRange(range, 10));
  const { dir } = await fixture(t);
  await fs.mkdir(path.join(dir, "files"));
  await fs.writeFile(path.join(dir, "secret"), "secret");
  await fs.symlink(path.join(dir, "secret"), path.join(dir, "files", "link"));
  await assert.rejects(safePath(path.join(dir, "files"), "../secret"));
  await assert.rejects(safePath(path.join(dir, "files"), "link"));
});
test("48h retention from completion, batch over one page, active and snapshots preserved", async (t) => {
  const { dir, store } = await fixture(t);
  const snapshot = store.snapshot({ title: "Saved" });
  for (let i = 0; i < 35; i++) {
    const id = store.enqueue(snapshot);
    store.claim();
    store.finish(id, 3, 1000);
    await fs.writeFile(path.join(dir, `${id}.mp4`), "abc");
  }
  assert.equal(
    (await expireVideos(store, dir, 1000 + retentionMs - 1)).removed,
    0,
  );
  const active = store.enqueue(snapshot);
  await fs.writeFile(path.join(dir, `${active}.partial.mp4`), "active");
  const eligible = store.list();
  const later = store.enqueue(snapshot);
  store.claim();
  store.cancel(active);
  store.claim();
  store.finish(later, 3);
  await fs.writeFile(path.join(dir, `${later}.mp4`), "new");
  const result = await removeVideos(store, dir, eligible);
  assert.equal(result.removed, 35);
  assert.equal(result.bytes, 105);
  assert.equal(store.get(later).available, 1);
  assert.equal(
    await fs.readFile(path.join(dir, `${active}.partial.mp4`), "utf8"),
    "active",
  );
  assert.equal(store.getSnapshot(snapshot).title, "Saved");
});
test("expired videos removed at boundary", async (t) => {
  const { dir, store } = await fixture(t);
  const id = store.enqueue(store.snapshot({}));
  store.claim();
  store.finish(id, 3, 100);
  await fs.writeFile(path.join(dir, `${id}.mp4`), "abc");
  assert.equal((await expireVideos(store, dir, 100 + retentionMs)).removed, 1);
  assert.equal(store.get(id).available, 0);
});
test("WAL-consistent backup and restore integrity", async (t) => {
  const { dir, store } = await fixture(t);
  const id = store.snapshot({ title: "Backup" });
  const destination = path.join(dir, "backup.sqlite");
  await backupDatabase(path.join(dir, "app.sqlite"), destination);
  const restored = new DatabaseSync(destination);
  assert.equal(
    restored.prepare("PRAGMA integrity_check").get().integrity_check,
    "ok",
  );
  assert.equal(
    JSON.parse(
      restored.prepare("SELECT job FROM snapshots WHERE id=?").get(id).job,
    ).title,
    "Backup",
  );
  restored.close();
});

test("safe diagnostics do not copy secrets, URLs, narration or stack data", async () => {
  const { safeDiagnostic } = await import("../../scripts/online/logging.mjs");
  const diagnostic = safeDiagnostic(
    new Error(
      "Download failed https://secret.example/?token=private narration=private",
    ),
    "render_media",
  );
  assert.equal(diagnostic.reason, "network_or_asset_failure");
  assert(!JSON.stringify(diagnostic).includes("private"));
});
