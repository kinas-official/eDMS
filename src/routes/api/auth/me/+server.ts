import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/guard';
import type { RequestHandler } from './$types';

/** The signed-in user with their resolved permissions; 401 when there's no session. */
export const GET: RequestHandler = (event) => {
	return json({ user: requireUser(event) });
};
