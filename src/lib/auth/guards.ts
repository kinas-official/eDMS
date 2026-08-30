import type { User } from '$lib/auth/store';
import { canAdmin } from '$lib/permissions/rbac';

/**
 * Gate for everything under `/admin`.
 *
 * This is deliberately a plain predicate rather than a `+layout.ts` load with a
 * `redirect()`: `currentUser` is read from localStorage, so during SSR there is
 * no session to see and a server-side guard would bounce every admin. The admin
 * layout calls this on the client instead.
 */
export function requireAdmin(user: User | null): boolean {
	return canAdmin(user);
}

export function requireAuthenticated(user: User | null): boolean {
	return !!user;
}
