import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, "../../data/analytics.db");

let db: Database.Database;

export function initAnalyticsDb(): void {
  const dbPath = process.env.ANALYTICS_DB_PATH ?? DEFAULT_DB_PATH;
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_analyses (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      date        TEXT NOT NULL,
      tab         TEXT NOT NULL,
      content     TEXT NOT NULL,
      input_hash  TEXT NOT NULL,
      model       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date, tab)
    );

    CREATE TABLE IF NOT EXISTS weekly_analyses (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      week_start  TEXT NOT NULL,
      content     TEXT NOT NULL,
      daily_hashes TEXT NOT NULL,
      model       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, week_start)
    );
  `);
}

// ─── Daily ───

export interface DailyAnalysis {
  id: string;
  user_id: string;
  date: string;
  tab: string;
  content: string;
  input_hash: string;
  model: string;
  created_at: string;
}

export function getDailyAnalysis(
  userId: string,
  date: string,
  tab: string
): DailyAnalysis | undefined {
  return db
    .prepare(
      "SELECT * FROM daily_analyses WHERE user_id = ? AND date = ? AND tab = ?"
    )
    .get(userId, date, tab) as DailyAnalysis | undefined;
}

export function upsertDailyAnalysis(
  userId: string,
  date: string,
  tab: string,
  content: string,
  inputHash: string,
  model: string
): void {
  db.prepare(
    `INSERT INTO daily_analyses (id, user_id, date, tab, content, input_hash, model)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date, tab) DO UPDATE SET
       content = excluded.content,
       input_hash = excluded.input_hash,
       model = excluded.model,
       created_at = datetime('now')`
  ).run(randomUUID(), userId, date, tab, content, inputHash, model);
}

// ─── Weekly ───

export interface WeeklyAnalysis {
  id: string;
  user_id: string;
  week_start: string;
  content: string;
  daily_hashes: string;
  model: string;
  created_at: string;
}

export function getWeeklyAnalysis(
  userId: string,
  weekStart: string
): WeeklyAnalysis | undefined {
  return db
    .prepare(
      "SELECT * FROM weekly_analyses WHERE user_id = ? AND week_start = ?"
    )
    .get(userId, weekStart) as WeeklyAnalysis | undefined;
}

export function upsertWeeklyAnalysis(
  userId: string,
  weekStart: string,
  content: string,
  dailyHashes: string[],
  model: string
): void {
  db.prepare(
    `INSERT INTO weekly_analyses (id, user_id, week_start, content, daily_hashes, model)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, week_start) DO UPDATE SET
       content = excluded.content,
       daily_hashes = excluded.daily_hashes,
       model = excluded.model,
       created_at = datetime('now')`
  ).run(
    randomUUID(),
    userId,
    weekStart,
    content,
    JSON.stringify(dailyHashes),
    model
  );
}

/**
 * Get all daily analyses for a week (7 days starting from weekStart).
 * weekStart is a Monday in DD-MM-YYYY format.
 */
export function getDailyAnalysesForWeek(
  userId: string,
  dates: string[]
): DailyAnalysis[] {
  const placeholders = dates.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT * FROM daily_analyses
       WHERE user_id = ? AND date IN (${placeholders}) AND tab = 'day'
       ORDER BY date`
    )
    .all(userId, ...dates) as DailyAnalysis[];
}
