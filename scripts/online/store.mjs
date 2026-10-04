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
  return {
    db,
    snapshot(job) {
      const id = randomUUID();
      db.prepare("INSERT INTO snapshots VALUES (?, ?, ?)").run(
        id,
        JSON.stringify(job),
        Date.now(),
      );
      return id;
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
    progress(id, value) {
      db.prepare(
        "UPDATE renders SET progress=? WHERE id=? AND status='rendering'",
      ).run(value, id);
    },
    finish(id, bytes, now = Date.now()) {
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
      db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
      db.prepare("DELETE FROM oauth WHERE expires<=?").run(Date.now());
    },
  };
}
