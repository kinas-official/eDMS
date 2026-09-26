import type { Permission, Role } from '$lib/settings/types';

/**
 * The signed-in user as the API returns it. `permissions` is resolved on the
 * server from the role matrix in Settings, so the UI never works out access
 * rules on its own.
 */
export interface AuthUser {
	id: string;
	username: string;
	name: string;
	role: Role;
	departmentId: number | null;
	department: string | null;
	permissions: Permission[];
}
