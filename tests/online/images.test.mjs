import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { openStore } from "../../scripts/online/store.mjs";
import { normalizeImage } from "../../scripts/online/normalize-image.mjs";
import {
  acceptImage,
  prepareImages,
  expireUploads,
  uploadRetention,
} from "../../scripts/online/uploads.mjs";
import { Readable } from "node:stream";
const picture = () =>
  sharp({
    create: { width: 1080, height: 1920, channels: 3, background: "#cf1600" },
  })
    .png()
    .toBuffer();

test("normalize images rejects disguised formats, malformed files and wrong dimensions, strips metadata", async () => {
  await assert.rejects(
    normalizeImage(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    ),
    /invalid_image/,
  );
  await assert.rejects(normalizeImage(Buffer.from([255, 216, 255, 0])));
  const small = await sharp({
    create: { width: 1920, height: 1080, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  await assert.rejects(normalizeImage(small), /image_dimensions/);
  const exif = await sharp(await picture())
    .withMetadata({ exif: { IFD0: { Artist: "private person" } } })
    .jpeg()
    .toBuffer();
  const normalized = await normalizeImage(exif);
  const metadata = await sharp(normalized).metadata();
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  assert.equal(metadata.exif, undefined);
});

test("uploads, timing, enqueue, expiry and active-job protection use immutable image files", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rdb-images-"));
  const store = openStore(directory);
  try {
    const bytes = await picture();
    const req = Readable.from([bytes]);
    req.headers = { "content-type": "image/png" };
    const upload = await acceptImage(req, store, directory);
    assert.match(upload.id, /^[a-f0-9]{64}$/);
    const single = prepareImages(
      { mode: "single", images: [{ id: upload.id, seconds: 59 }] },
      store,
    );
    assert.equal(single.durationInFrames, 360);
    const sequence = prepareImages(
      {
        mode: "sequence",
        images: [
          { id: upload.id, seconds: 3 },
          { id: upload.id, seconds: 7 },
        ],
      },
      store,
    );
    assert.equal(sequence.durationInFrames, 300);
    assert.deepEqual(
      sequence.images.map((i) => i.durationInFrames),
      [90, 210],
    );
    for (const seconds of [0, -1, 1.5, NaN, Infinity, 61])
      assert.throws(() =>
        prepareImages(
          {
            mode: "sequence",
            images: [
              { id: upload.id, seconds },
              { id: upload.id, seconds: 1 },
            ],
          },
          store,
        ),
      );
    assert.throws(
      () =>
        prepareImages(
          {
            mode: "sequence",
            images: Array(5).fill({ id: upload.id, seconds: 13 }),
          },
          store,
        ),
      /image_duration_limit/,
    );
    assert.equal(
      prepareImages(
        {
          mode: "sequence",
          images: Array(5).fill({ id: upload.id, seconds: 12 }),
        },
        store,
      ).durationInFrames,
      1800,
    );
    assert.throws(
      () =>
        prepareImages(
          {
            mode: "sequence",
            images: Array(6).fill({ id: upload.id, seconds: 1 }),
          },
          store,
        ),
      /invalid_image_sequence/,
    );
    assert.throws(
      () =>
        prepareImages(
          { mode: "single", images: [{ id: "../etc/passwd" }] },
          store,
        ),
      /invalid_image/,
    );
    const snapshot = store.snapshot(sequence),
      render = store.enqueue(snapshot);
    store.db.prepare("UPDATE uploads SET expires=0").run();
    await expireUploads(store, directory);
    assert.ok(
      await fs.stat(path.join(directory, "uploads", `${upload.id}.png`)),
    );
    store.claim();
    store.finish(render, 10);
    assert.ok(
      store.db.prepare("SELECT expires FROM uploads").get().expires >
        Date.now() + uploadRetention - 1000,
    );
    await expireUploads(store, directory, Date.now() + uploadRetention + 1000);
    assert.throws(() => store.enqueue(snapshot), /upload_expired/);
    assert.equal(store.getSnapshot(snapshot).durationInFrames, 300);
    await assert.rejects(
      fs.stat(path.join(directory, "uploads", `${upload.id}.png`)),
      { code: "ENOENT" },
    );
  } finally {
    store.db.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("oversized uploads are rejected with and without Content-Length before decoding", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "rdb-image-limit-"),
  );
  const store = openStore(directory);
  try {
    const declared = Readable.from([Buffer.from("fake")]);
    declared.headers = {
      "content-type": "image/png",
      "content-length": String(8 * 1024 * 1024 + 1),
    };
    await assert.rejects(
      acceptImage(declared, store, directory),
      /image_too_large/,
    );
    const streamed = Readable.from([
      Buffer.alloc(8 * 1024 * 1024),
      Buffer.from("x"),
    ]);
    streamed.headers = { "content-type": "image/png" };
    await assert.rejects(
      acceptImage(streamed, store, directory),
      /image_too_large/,
    );
    assert.equal(store.db.prepare("SELECT count(*) n FROM uploads").get().n, 0);
  } finally {
    store.db.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
