import { json } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { deleteSessionCookie, invalidateSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

/** Public and idempotent, so a stale or expired cookie can always be cleared. */
export const POST: RequestHandler = (event) => {
	const { session, user } = event.locals;

	if (session) {
		invalidateSession(session.id);
		if (user) logActivity({ action: 'logout', actor: { id: user.id, name: user.name } });
	}
	deleteSessionCookie(event);

	return json({ ok: true });
};
