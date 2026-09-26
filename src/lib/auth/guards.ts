import type { AuthUser } from '$lib/auth/types';
import { isAdmin } from '$lib/permissions';

/**
 * Which `/admin` pages a user may open. This only decides what the UI shows;
 * the API enforces access itself. It runs on the client because the desktop
 * app's pages are bundled and never pass through the server's hooks.
 */

/** Where non-admins land, and the only admin-area page they can open. */
export const NON_ADMIN_HOME = '/admin/documents';

const NON_ADMIN_PATHS = [NON_ADMIN_HOME];

export function canAccessPath(user: AuthUser | null, path: string): boolean {
	if (!user) return false;
	if (isAdmin(user)) return true;
	return NON_ADMIN_PATHS.includes(path);
}
