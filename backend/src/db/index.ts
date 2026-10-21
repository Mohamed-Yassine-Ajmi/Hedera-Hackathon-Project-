import Database, { type Database as DatabaseInstance } from 'better-sqlite3';
import * as path from 'path';
import { config } from '../config.js';

export type SqliteDatabase = DatabaseInstance;

let dbInstance: DatabaseInstance | null = null;

export function getDb(): DatabaseInstance {
  if (!dbInstance) {
    const dbPath = path.isAbsolute(config.databasePath)
      ? config.databasePath
      : path.resolve(process.cwd(), config.databasePath);

    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export const db: DatabaseInstance = getDb();
