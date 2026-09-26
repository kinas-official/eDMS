import { PERMISSION_LABELS, type Permission, type Role } from '$lib/settings/types';

/**
 * The one permission check, shared by the server and the UI. The server is
 * the authority: it resolves a user's permissions per request and returns
 * them from /api/auth/me. The UI uses `can()` only to decide what to show.
 */

export const ALL_PERMISSIONS: Permission[] = PERMISSION_LABELS.map((p) => p.value);

/** Admins always get everything, so a bad edit to the role matrix can't lock everyone out. */
export function resolvePermissions(
	role: Role,
	matrix: Partial<Record<Role, Permission[]>>
): Permission[] {
	if (role === 'admin') return [...ALL_PERMISSIONS];
	const granted = matrix[role] ?? [];
	return ALL_PERMISSIONS.filter((p) => granted.includes(p));
}

interface Subject {
	role: Role;
	permissions: Permission[];
}

export function can(user: Subject | null | undefined, permission: Permission): boolean {
	return !!user?.permissions.includes(permission);
}

/** Admin-only areas (users, departments, settings) that aren't part of the role matrix. */
export function isAdmin(user: Subject | null | undefined): boolean {
	return user?.role === 'admin';
}
