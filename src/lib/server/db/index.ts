import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { openDatabase } from './client.ts';

export { runMigrations } from './client.ts';
export * as schema from './schema.ts';

// `vite build` imports server modules to analyse routes; don't create the real
// database file as a side effect of building.
export const db = openDatabase(building ? ':memory:' : (env.DATABASE_URL ?? 'data/edms.db'));
