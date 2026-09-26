import { createHash, randomBytes } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '$lib/auth/types';
import { db, schema } from '$lib/server/db';
import type { Session } from '$lib/server/db/schema';
import { getAppSettings } from '$lib/server/settings';
import { toAuthUser } from './user';

const { sessions, users, departments } = schema;

export const SESSION_COOKIE = 'edms_session';

const MINUTE = 60_000;
/** Used when Settings has the idle timeout switched off (0 minutes). */
const NO_TIMEOUT_LIFETIME = 30 * 24 * 60 * MINUTE;

/**
 * Sessions are identified by an opaque random token. The browser gets it in an
 * httpOnly cookie; the desktop app sends it as `Authorization: Bearer`,
 * because a bundled UI talking to a LAN server over http can't use cookies.
 * Only its SHA-256 is stored.
 */
function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

function sessionLifetime(timeoutMinutes: number) {
	return timeoutMinutes > 0 ? timeoutMinutes * MINUTE : NO_TIMEOUT_LIFETIME;
}

export function createSession(userId: string) {
	const token = randomBytes(32).toString('base64url');
	const lifetime = sessionLifetime(getAppSettings().security.sessionTimeoutMinutes);
	const session = db
		.insert(sessions)
		.values({ id: hashToken(token), userId, expiresAt: new Date(Date.now() + lifetime) })
		.returning()
		.get();
	return { token, session };
}

export interface ValidatedSession {
	session: Session;
	user: AuthUser;
	/** True when the expiry was pushed out, so a cookie needs re-sending. */
	renewed: boolean;
}

/**
 * Idle timeout: each request made in the second half of the session's
 * lifetime extends it by a full lifetime, so active users stay signed in and
 * idle ones drop out after the configured minutes.
 */
export function validateSessionToken(token: string): ValidatedSession | null {
	const row = db
		.select({ session: sessions, user: users, department: departments.name })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.leftJoin(departments, eq(users.departmentId, departments.id))
		.where(eq(sessions.id, hashToken(token)))
		.get();
	if (!row) return null;

	const now = Date.now();
	if (row.session.expiresAt.getTime() <= now || row.user.status !== 'active') {
		invalidateSession(row.session.id);
		return null;
	}

	const settings = getAppSettings();
	const lifetime = sessionLifetime(settings.security.sessionTimeoutMinutes);
	let session = row.session;
	let renewed = false;

	if (session.expiresAt.getTime() - now < lifetime / 2) {
		session = db
			.update(sessions)
			.set({ expiresAt: new Date(now + lifetime) })
			.where(eq(sessions.id, session.id))
			.returning()
			.get();
		renewed = true;
	}

	return { session, user: toAuthUser(row.user, row.department, settings.roles), renewed };
}

export function invalidateSession(sessionId: string) {
	db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

/** For password changes, deactivation, etc.: signs the user out everywhere. */
export function invalidateUserSessions(userId: string) {
	db.delete(sessions).where(eq(sessions.userId, userId)).run();
}

export function readSessionToken(event: RequestEvent) {
	const header = event.request.headers.get('authorization');
	if (header?.startsWith('Bearer ')) {
		return { token: header.slice('Bearer '.length).trim(), source: 'header' as const };
	}
	const cookie = event.cookies.get(SESSION_COOKIE);
	return cookie ? { token: cookie, source: 'cookie' as const } : null;
}

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// SvelteKit defaults to `secure` everywhere but localhost, which would make
		// browsers drop the cookie on a plain-http LAN address like 192.168.1.10.
		secure: event.url.protocol === 'https:',
		expires: expiresAt
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/', secure: event.url.protocol === 'https:' });
}
