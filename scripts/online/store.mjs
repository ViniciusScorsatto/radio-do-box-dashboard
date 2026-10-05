import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const retentionMs = 48 * 3600_000;
export function openStore(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, "app.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, job TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS renders (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, status TEXT NOT NULL, progress REAL NOT NULL DEFAULT 0, created INTEGER NOT NULL, completed INTEGER, expires INTEGER, bytes INTEGER NOT NULL DEFAULT 0, available INTEGER NOT NULL DEFAULT 0, error TEXT);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS oauth (id TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, bytes INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits (scope TEXT PRIMARY KEY, started INTEGER NOT NULL, used INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS renders_created ON renders(created);
    CREATE INDEX IF NOT EXISTS renders_snapshot ON renders(snapshot);
    PRAGMA user_version=1;`);
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  const requireUploads = (job) => {
    if (job.template !== "uploaded-images") return;
    for (const image of job.images) {
      const row = db
        .prepare("SELECT expires FROM uploads WHERE id=? AND expires>?")
        .get(image.id, Date.now());
      if (
        !row ||
        !fs.existsSync(path.join(directory, "uploads", `${image.id}.png`))
      )
        throw new Error("upload_expired");
    }
  };
  return {
    db,
    requireUploads,
    consumeLimit(scope, maximum, windowMs, now = Date.now()) {
      return transaction(() => {
        const row = db.prepare("SELECT * FROM limits WHERE scope=?").get(scope);
        if (row && now < row.started + windowMs && row.used >= maximum) {
          const error = new Error("rate_limited");
          error.retryAfter = Math.ceil((row.started + windowMs - now) / 1000);
          throw error;
        }
        db.prepare("INSERT OR REPLACE INTO limits VALUES (?,?,?)").run(
          scope,
          row && now < row.started + windowMs ? row.started : now,
          row && now < row.started + windowMs ? row.used + 1 : 1,
        );
      });
    },
    snapshot(job) {
      const serialized = JSON.stringify(job);
      const bytes = Buffer.byteLength(serialized);
      if (bytes > 1024 * 1024) throw new Error("snapshot_too_large");
      return transaction(() => {
        const used = db
          .prepare(
            "SELECT coalesce(sum(length(CAST(job AS BLOB))),0) bytes FROM snapshots",
          )
          .get().bytes;
        if (used + bytes > 256 * 1024 * 1024) throw new Error("storage_quota");
        const id = randomUUID();
        db.prepare("INSERT INTO snapshots VALUES (?, ?, ?)").run(
          id,
          serialized,
          Date.now(),
        );
        return id;
      });
    },
    getSnapshot(id) {
      const row = db.prepare("SELECT job FROM snapshots WHERE id=?").get(id);
      return row ? JSON.parse(row.job) : null;
    },
    enqueue(snapshot) {
      return transaction(() => {
        if (!db.prepare("SELECT id FROM snapshots WHERE id=?").get(snapshot))
          throw new Error("snapshot_missing");
        if (
          db
            .prepare(
              "SELECT count(*) n FROM renders WHERE status IN ('queued','rendering')",
            )
            .get().n >= 20
        )
          throw new Error("queue_full");
        if (
          db
            .prepare("SELECT count(*) n FROM renders WHERE created>?")
            .get(Date.now() - 86400_000).n >= 120
        )
          throw new Error("render_daily_limit");
        if (db.prepare("SELECT count(*) n FROM renders").get().n >= 50000)
          throw new Error("storage_quota");
        const job = JSON.parse(
          db.prepare("SELECT job FROM snapshots WHERE id=?").get(snapshot).job,
        );
        requireUploads(job);
        if (job.template === "uploaded-images")
          for (const image of job.images)
            db.prepare("UPDATE uploads SET expires=? WHERE id=?").run(
              Date.now() + retentionMs,
              image.id,
            );
        const id = randomUUID();
        db.prepare(
          "INSERT INTO renders(id,snapshot,status,created) VALUES (?,?,'queued',?)",
        ).run(id, snapshot, Date.now());
        return id;
      });
    },
    claim() {
      return transaction(() => {
        if (
          db
            .prepare("SELECT id FROM renders WHERE status='rendering' LIMIT 1")
            .get()
        )
          return undefined;
        const row = db
          .prepare(
            "SELECT * FROM renders WHERE status='queued' ORDER BY created LIMIT 1",
          )
          .get();
        if (row)
          db.prepare("UPDATE renders SET status='rendering' WHERE id=?").run(
            row.id,
          );
        return row;
      });
    },
    get(id) {
      return db.prepare("SELECT * FROM renders WHERE id=?").get(id);
    },
    list() {
      return db
        .prepare(
          "SELECT renders.*, json_extract(snapshots.job,'$.title') title FROM renders JOIN snapshots ON snapshots.id=renders.snapshot ORDER BY created DESC",
        )
        .all();
    },
    page(page = 1) {
      if (!Number.isSafeInteger(page) || page < 1 || page > 1667)
        throw new Error("invalid_page");
      const total = db.prepare("SELECT count(*) n FROM renders").get().n;
      const rows = db
        .prepare(
          "SELECT renders.*, json_extract(snapshots.job,'$.title') title FROM renders JOIN snapshots ON snapshots.id=renders.snapshot ORDER BY created DESC, renders.id DESC LIMIT 30 OFFSET ?",
        )
        .all((page - 1) * 30);
      const bytes = db
        .prepare(
          "SELECT coalesce(sum(bytes),0) bytes FROM renders WHERE available=1",
        )
        .get().bytes;
      return {
        rows,
        total,
        bytes,
        page,
        pages: Math.max(1, Math.ceil(total / 30)),
      };
    },
    progress(id, value) {
      db.prepare(
        "UPDATE renders SET progress=? WHERE id=? AND status='rendering'",
      ).run(value, id);
    },
    finish(id, bytes, now = Date.now()) {
      const jobRow = db
        .prepare(
          "SELECT snapshots.job FROM renders JOIN snapshots ON snapshots.id=renders.snapshot WHERE renders.id=? AND status='rendering'",
        )
        .get(id);
      if (jobRow) {
        const job = JSON.parse(jobRow.job);
        if (job.template === "uploaded-images")
          for (const image of job.images)
            db.prepare("UPDATE uploads SET expires=? WHERE id=?").run(
              now + retentionMs,
              image.id,
            );
      }
      return db
        .prepare(
          "UPDATE renders SET status='completed', progress=1, completed=?, expires=?, bytes=?, available=1 WHERE id=? AND status='rendering'",
        )
        .run(now, now + retentionMs, bytes, id).changes;
    },
    fail(id, error = "render_failed") {
      db.prepare(
        "UPDATE renders SET status='failed',error=? WHERE id=? AND status='rendering'",
      ).run(error, id);
    },
    cancel(id) {
      db.prepare(
        "UPDATE renders SET status='cancelled' WHERE id=? AND status IN ('queued','rendering')",
      ).run(id);
    },
    recover() {
      db.prepare(
        "UPDATE renders SET status='failed',error='interrupted' WHERE status='rendering'",
      ).run();
    },
    session(token, now = Date.now()) {
      return db
        .prepare("SELECT email FROM sessions WHERE id=? AND expires>?")
        .get(hash(token), now);
    },
    addSession(token, email, now = Date.now()) {
      db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
        hash(token),
        email,
        now + 7 * 86400_000,
      );
    },
    revoke(token) {
      db.prepare("DELETE FROM sessions WHERE id=?").run(hash(token));
    },
    addOAuth(token, data) {
      db.prepare("DELETE FROM oauth WHERE expires<=?").run(Date.now());
      if (db.prepare("SELECT count(*) n FROM oauth").get().n >= 100)
        throw new Error("rate_limited");
      db.prepare("INSERT INTO oauth VALUES (?,?,?)").run(
        hash(token),
        JSON.stringify(data),
        Date.now() + 600_000,
      );
    },
    consumeOAuth(token) {
      return transaction(() => {
        const row = db
          .prepare("SELECT * FROM oauth WHERE id=?")
          .get(hash(token));
        db.prepare("DELETE FROM oauth WHERE id=?").run(hash(token));
        return row && row.expires > Date.now() ? JSON.parse(row.data) : null;
      });
    },
    cleanupAuth() {
      db.prepare(
        "DELETE FROM snapshots WHERE created<? AND id NOT IN (SELECT snapshot FROM renders)",
      ).run(Date.now() - 7 * 86400_000);
      db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
      db.prepare("DELETE FROM oauth WHERE expires<=?").run(Date.now());
    },
  };
}
