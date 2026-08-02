import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In-Progress', 'Complete')),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_topic ON tasks (topic);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
`;

let cachedDb = null;

/**
 * Opens (and lazily initialises) a SQLite database.
 * @param {string} [dbPath] - path to the db file. Defaults to data/app.db.
 *   Tests pass a throwaway path so they never touch the developer's real data.
 */
export function getDb(dbPath) {
  if (dbPath) {
    // Explicit path (used by tests) - always open fresh, never cache.
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(SCHEMA);
    return db;
  }

  if (cachedDb) return cachedDb;

  const defaultPath = path.join(process.cwd(), "data", "app.db");
  const dir = path.dirname(defaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  cachedDb = new Database(defaultPath);
  cachedDb.pragma("journal_mode = WAL");
  cachedDb.exec(SCHEMA);
  return cachedDb;
}
