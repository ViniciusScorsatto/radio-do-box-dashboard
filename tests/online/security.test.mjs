import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openStore } from "../../scripts/online/store.mjs";
import { childEnvironment } from "../../scripts/online/security.mjs";

test("rate budgets persist across restarts and reset only after the window", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rdb-limits-"));
  let store = openStore(directory);
  try {
    store.consumeLimit("login-start", 2, 60000, 1000);
    store.consumeLimit("login-start", 2, 60000, 2000);
    store.db.close();
    store = openStore(directory);
    assert.throws(
      () => store.consumeLimit("login-start", 2, 60000, 3000),
      (e) => e.message === "rate_limited" && e.retryAfter === 58,
    );
    store.consumeLimit("login-callback", 2, 60000, 3000);
    store.consumeLimit("login-start", 2, 60000, 61000);
  } finally {
    store.db.close();
    fs.rmSync(directory, { recursive: true });
  }
});

test("cancelled renders still count towards persistent rolling daily budget", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rdb-budget-"));
  const store = openStore(directory);
  try {
    const snapshot = store.snapshot({ title: "Test" });
    for (let i = 0; i < 120; i++) store.cancel(store.enqueue(snapshot));
    assert.throws(() => store.enqueue(snapshot), /render_daily_limit/);
    store.db.prepare("UPDATE renders SET created=0").run();
    assert.ok(store.enqueue(snapshot));
  } finally {
    store.db.close();
    fs.rmSync(directory, { recursive: true });
  }
});

test("children receive only necessary runtime variables", () => {
  assert.deepEqual(
    childEnvironment({
      PATH: "/bin",
      APP_DATA_DIR: "/data",
      GOOGLE_CLIENT_SECRET: "secret",
      UNKNOWN_TOKEN: "secret",
    }),
    { PATH: "/bin", APP_DATA_DIR: "/data" },
  );
});
