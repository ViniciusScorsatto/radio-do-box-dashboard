import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { boundedText } from "../../scripts/lib/bounded-response.mjs";
import { openStore } from "../../scripts/online/store.mjs";
import { maintainStorage } from "../../scripts/online/maintenance.mjs";

test("source byte limit rejects declared and streamed oversize bodies and cancels stream", async () => {
  await assert.rejects(
    boundedText(
      new Response("abc", { headers: { "content-length": "100" } }),
      3,
    ),
    /source_too_large/,
  );
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(4));
      },
      cancel() {
        cancelled = true;
      },
    }),
  );
  await assert.rejects(boundedText(response, 3), /source_too_large/);
  assert.equal(cancelled, true);
  assert.equal(await boundedText(new Response("á"), 2), "á");
  await assert.rejects(boundedText(new Response("á"), 1), /source_too_large/);
});

test("history pages are bounded and stable on equal timestamps; snapshots have byte limits", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-pages-"));
  const store = openStore(directory);
  try {
    const snapshot = store.snapshot({ title: "Test" });
    for (let i = 0; i < 35; i++) store.cancel(store.enqueue(snapshot));
    store.db.prepare("UPDATE renders SET created=100").run();
    const first = store.page(1),
      second = store.page(2);
    assert.equal(first.rows.length, 30);
    assert.equal(second.rows.length, 5);
    assert.equal(first.total, 35);
    assert.equal(first.pages, 2);
    assert.equal(
      new Set([...first.rows, ...second.rows].map((r) => r.id)).size,
      35,
    );
    for (const value of [0, NaN, Infinity, 1.5, 1668])
      assert.throws(() => store.page(value), /invalid_page/);
    assert.throws(
      () => store.snapshot({ text: "á".repeat(524288) }),
      /snapshot_too_large/,
    );
  } finally {
    store.db.close();
    await fs.rm(directory, { recursive: true });
  }
});

test("maintenance preserves referenced and recent portraits, removes only old orphan files", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-maintain-"));
  const assets = path.join(directory, "public", "online-assets");
  await fs.mkdir(assets, { recursive: true });
  const store = openStore(directory);
  try {
    const kept = "a".repeat(64) + ".png",
      orphan = "b".repeat(64) + ".png",
      recent = "c".repeat(64) + ".png";
    for (const file of [kept, orphan, recent, "unknown.txt"])
      await fs.writeFile(path.join(assets, file), "fixture");
    for (const file of [kept, orphan, "unknown.txt"])
      await fs.utimes(path.join(assets, file), new Date(0), new Date(0));
    store.cancel(
      store.enqueue(store.snapshot({ image: `/online-assets/${kept}` })),
    );
    await maintainStorage(store, directory);
    assert.deepEqual(
      (await fs.readdir(assets)).sort(),
      [kept, recent, "unknown.txt"].sort(),
    );
    assert.equal(store.list().length, 1);
  } finally {
    store.db.close();
    await fs.rm(directory, { recursive: true });
  }
});

test("portrait quota refuses additional files without changing existing assets", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "rdb-portrait-quota-"),
  );
  const previous = process.env.APP_DATA_DIR;
  const originalFetch = globalThis.fetch;
  const assets = path.join(directory, "public", "online-assets");
  await fs.mkdir(assets, { recursive: true });
  const quota = path.join(assets, "existing.bin");
  await fs.writeFile(quota, "");
  await fs.truncate(quota, 512 * 1024 * 1024);
  process.env.APP_DATA_DIR = directory;
  globalThis.fetch = async () =>
    new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  try {
    const { persistOnlinePortrait } = await import(
      "../../scripts/lib/online-portraits.mjs"
    );
    await assert.rejects(
      persistOnlinePortrait(
        "https://api.paddockfan.com.br/simetraapppaddockfan/imagens/test.png",
        { category: "stock-pro", season: 2026 },
      ),
      /portrait_storage_quota/,
    );
    assert.deepEqual(await fs.readdir(assets), ["existing.bin"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.APP_DATA_DIR;
    else process.env.APP_DATA_DIR = previous;
    await fs.rm(directory, { recursive: true });
  }
});
