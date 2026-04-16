import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'warehouse.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rack_skids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    level INTEGER NOT NULL,
    place INTEGER NOT NULL DEFAULT 1,
    verified INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT,
    is_order INTEGER NOT NULL DEFAULT 0,
    so_number TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(section, level, place)
  );

  CREATE TABLE IF NOT EXISTS rack_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skid_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (skid_id) REFERENCES rack_skids(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS floor_skids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT,
    is_order INTEGER NOT NULL DEFAULT 0,
    so_number TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS floor_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor_skid_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (floor_skid_id) REFERENCES floor_skids(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rack_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    level INTEGER NOT NULL,
    places INTEGER NOT NULL DEFAULT 1,
    UNIQUE(section, level)
  );
`);

export default db;
