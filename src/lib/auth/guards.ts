import type { User } from '$lib/auth/store';
import { canAdmin } from '$lib/permissions/rbac';

/**
 * Guards for everything under `/admin`.
 *
 * These are deliberately plain predicates rather than a `+layout.ts` load with a
 * `redirect()`: `currentUser` is read from localStorage, so during SSR there is
 * no session to see and a server-side guard would bounce everyone. The admin
 * layout calls these on the client instead.
 */
export function requireAdmin(user: User | null): boolean {
	return canAdmin(user);
}

export function requireAuthenticated(user: User | null): boolean {
	return !!user;
}

/** Where non-admins land, and the only admin-area page they can open. */
export const NON_ADMIN_HOME = '/admin/documents';

const NON_ADMIN_PATHS = [NON_ADMIN_HOME];

export function canAccessPath(user: User | null, path: string): boolean {
	if (!user) return false;
	if (canAdmin(user)) return true;
	return NON_ADMIN_PATHS.includes(path);
}
