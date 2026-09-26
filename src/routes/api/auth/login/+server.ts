import { error, json } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import {
	clearLoginFailures,
	loginBlockedFor,
	recordLoginFailure
} from '$lib/server/auth/rate-limit';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { findUserByUsername, loadAuthUser } from '$lib/server/auth/user';
import type { RequestHandler } from './$types';

const INVALID = 'Invalid username or password';

// Verified against when the username doesn't exist, so response time doesn't
// reveal which usernames are real.
let dummyHash: Promise<string> | undefined;

/**
 * Body: `{ username, password, client? }`. Browsers get an httpOnly cookie;
 * `client: "desktop"` returns the token in the body instead, for the Tauri
 * app to send as a Bearer header.
 */
export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	const username = typeof body?.username === 'string' ? body.username.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!username || !password || username.length > 64 || password.length > 256) {
		error(400, 'Username and password are required');
	}

	const throttleKey = `${event.getClientAddress()}|${username.toLowerCase()}`;
	const wait = loginBlockedFor(throttleKey);
	if (wait) {
		const minutes = Math.ceil(wait / 60_000);
		return json(
			{ message: `Too many failed attempts. Try again in ${minutes} minute(s).` },
			{ status: 429, headers: { 'Retry-After': String(Math.ceil(wait / 1000)) } }
		);
	}

	const user = findUserByUsername(username);
	const valid = await verifyPassword(
		password,
		user?.passwordHash ?? (await (dummyHash ??= hashPassword('not-a-real-password')))
	);

	if (!user || !valid) {
		recordLoginFailure(throttleKey);
		logActivity({ action: 'login_failed', actor: null, actorName: username, details: INVALID });
		error(401, INVALID);
	}

	// Only revealed to someone who knows the password.
	if (user.status !== 'active') {
		error(403, 'This account is disabled. Contact an administrator.');
	}

	clearLoginFailures(throttleKey);
	const { token, session } = createSession(user.id);
	const desktop = body?.client === 'desktop';
	if (!desktop) setSessionCookie(event, token, session.expiresAt);

	logActivity({
		action: 'login',
		actor: { id: user.id, name: user.name },
		details: desktop ? 'Desktop app' : 'Web'
	});

	return json({ user: loadAuthUser(user.id), ...(desktop ? { token } : {}) });
};
