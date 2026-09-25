import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

/**
 * Unauthenticated liveness check. The desktop app will call this to confirm a
 * server address points at an eDMS server before saving it.
 */
export const GET: RequestHandler = () => {
	db.run(sql`select 1`);
	return json({ status: 'ok', service: 'edms' });
};
