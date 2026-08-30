import { get } from 'svelte/store';
import type { User } from '$lib/auth/store';
import { settings } from '$lib/settings/store';
import type { Permission } from '$lib/settings/types';

/**
 * Resolves a permission against the role matrix an admin configured in
 * Settings, rather than hardcoding "admin can do everything".
 */
export function can(user: User | null, permission: Permission): boolean {
	if (!user) return false;
	return canWith(get(settings).roles, user, permission);
}

/** Same check against an explicit matrix — for reactive contexts (`$settings`). */
export function canWith(
	roles: Record<string, Permission[]>,
	user: User | null,
	permission: Permission
): boolean {
	if (!user) return false;
	return (roles[user.role] ?? []).includes(permission);
}
