import { error, type RequestEvent } from '@sveltejs/kit';
import type { AuthUser } from '$lib/auth/types';
import { can, isAdmin } from '$lib/permissions';
import type { Permission } from '$lib/settings/types';

/**
 * Call at the top of every endpoint. `hooks.server.ts` already rejects
 * anonymous requests to /api, but each endpoint still states what it needs.
 */
export function requireUser(event: RequestEvent): AuthUser {
	const user = event.locals.user;
	if (!user) error(401, 'Not signed in');
	return user;
}

export function requirePermission(event: RequestEvent, permission: Permission): AuthUser {
	const user = requireUser(event);
	if (!can(user, permission)) error(403, 'You do not have permission to do that');
	return user;
}

export function requireAdmin(event: RequestEvent): AuthUser {
	const user = requireUser(event);
	if (!isAdmin(user)) error(403, 'Administrator access required');
	return user;
}
