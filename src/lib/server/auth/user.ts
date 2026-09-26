import { eq, sql } from 'drizzle-orm';
import type { AuthUser } from '$lib/auth/types';
import { resolvePermissions } from '$lib/permissions';
import { db, schema } from '$lib/server/db';
import type { User } from '$lib/server/db/schema';
import { getAppSettings } from '$lib/server/settings';
import type { AppSettings } from '$lib/settings/types';

const { users, departments } = schema;

/** Strips the password hash and attaches the permissions the user's role currently grants. */
export function toAuthUser(
	user: User,
	department: string | null,
	roles: AppSettings['roles'] = getAppSettings().roles
): AuthUser {
	return {
		id: user.id,
		username: user.username,
		name: user.name,
		role: user.role,
		departmentId: user.departmentId,
		department,
		permissions: resolvePermissions(user.role, roles)
	};
}

export function findUserByUsername(username: string) {
	return db
		.select()
		.from(users)
		.where(eq(sql`lower(${users.username})`, username.toLowerCase()))
		.get();
}

export function loadAuthUser(userId: string): AuthUser | null {
	const row = db
		.select({ user: users, department: departments.name })
		.from(users)
		.leftJoin(departments, eq(users.departmentId, departments.id))
		.where(eq(users.id, userId))
		.get();
	return row ? toAuthUser(row.user, row.department) : null;
}
