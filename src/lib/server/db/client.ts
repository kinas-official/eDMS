import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';

/**
 * Kept free of `$env`/`$app` imports so the seed script can use it outside
 * SvelteKit.
 */
export function openDatabase(url: string) {
	if (url !== ':memory:') mkdirSync(dirname(url), { recursive: true });

	const sqlite = new Database(url);
	// WAL lets readers keep going while an upload is being written.
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	sqlite.pragma('busy_timeout = 5000');

	return drizzle(sqlite, { schema });
}

export type DB = ReturnType<typeof openDatabase>;

export function runMigrations(db: DB, migrationsFolder = 'drizzle') {
	migrate(db, { migrationsFolder });
}
