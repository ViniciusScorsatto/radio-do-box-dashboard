import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { persistOnlinePortrait } from "../../scripts/lib/online-portraits.mjs";
import { openStore } from "../../scripts/online/store.mjs";
import { maintainStorage } from "../../scripts/online/maintenance.mjs";

const url =
  "https://api.paddockfan.com.br/simetraapppaddockfan/imagens/piloto.png";
const scope = { category: "stock-pro", season: 2026 };
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPe0AAAAASUVORK5CYII=",
  "base64",
);
async function setup(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-cache-"));
  const previous = process.env.APP_DATA_DIR;
  process.env.APP_DATA_DIR = directory;
  t.after(async () => {
    if (previous === undefined) delete process.env.APP_DATA_DIR;
    else process.env.APP_DATA_DIR = previous;
    await fs.rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test("season cache survives a fresh process and maintenance; new seasons preserve old assets", async (t) => {
  const directory = await setup(t);
  let downloads = 0;
  t.mock.method(globalThis, "fetch", async () => {
    downloads++;
    return new Response(
      downloads === 1 ? png : Buffer.concat([png, Buffer.from("new season")]),
    );
  });
  const [first, concurrent] = await Promise.all([
    persistOnlinePortrait(url, scope),
    persistOnlinePortrait(url, scope),
  ]);
  assert.equal(first, concurrent);
  assert.equal(downloads, 1);
  const filename = path.join(directory, "public", first);
  await fs.utimes(filename, new Date(0), new Date(0));
  const store = openStore(directory);
  try {
    await maintainStorage(store, directory);
  } finally {
    store.db.close();
  }
  assert.deepEqual(await fs.readFile(filename), png);
  const moduleUrl = new URL(
    "../../scripts/lib/online-portraits.mjs",
    import.meta.url,
  ).href;
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { persistOnlinePortrait } from ${JSON.stringify(moduleUrl)};
    globalThis.fetch = () => { throw new Error("must not download after restart"); };
    console.log(await persistOnlinePortrait(${JSON.stringify(url)}, ${JSON.stringify(scope)}));
  `,
    ],
    { encoding: "utf8", env: process.env },
  );
  assert.equal(output.trim(), first);
  const next = await persistOnlinePortrait(url, { ...scope, season: 2027 });
  assert.notEqual(next, first);
  assert.equal(downloads, 2);
  assert.equal(await persistOnlinePortrait(url, scope), first);
  assert.deepEqual(await fs.readFile(filename), png);
  await persistOnlinePortrait(url, { ...scope, category: "stock-light" });
  assert.equal(downloads, 3);
  await fs.unlink(filename);
  await persistOnlinePortrait(url, scope);
  assert.equal(downloads, 4);
});

test("failed downloads and invalid seasons never populate the cache", async (t) => {
  await setup(t);
  let downloads = 0;
  t.mock.method(globalThis, "fetch", async () => {
    downloads++;
    return downloads === 1
      ? new Response("unavailable", { status: 503 })
      : new Response(png);
  });
  await assert.rejects(
    persistOnlinePortrait(url, { ...scope, season: "wrong" }),
    /invalid_portrait_season/,
  );
  assert.equal(downloads, 0);
  await assert.rejects(
    persistOnlinePortrait(url, scope),
    /portrait_unavailable/,
  );
  const image = await persistOnlinePortrait(url, scope);
  assert.equal(await persistOnlinePortrait(url, scope), image);
  assert.equal(downloads, 2);
});
