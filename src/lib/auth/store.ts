import { writable } from 'svelte/store';
import { apiFetch, onUnauthorized } from '$lib/api/client';
import type { AuthUser } from './types';

/**
 * Client-side view of the session. The session itself is on the server (an
 * httpOnly cookie on the web), so nothing here is persisted: on a fresh load
 * the user is fetched again from /api/auth/me.
 */
export const currentUser = writable<AuthUser | null>(null);

/** False until the first session check finishes, so guards don't redirect too early. */
export const sessionChecked = writable(false);

onUnauthorized(() => currentUser.set(null));

let pending: Promise<AuthUser | null> | null = null;

export function loadSession(): Promise<AuthUser | null> {
	pending ??= apiFetch<{ user: AuthUser }>('/api/auth/me')
		.then(({ user }) => user)
		.catch(() => null)
		.then((user) => {
			currentUser.set(user);
			sessionChecked.set(true);
			return user;
		})
		.finally(() => (pending = null));
	return pending;
}

export async function signIn(username: string, password: string): Promise<AuthUser> {
	const { user } = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
	currentUser.set(user);
	sessionChecked.set(true);
	return user;
}

export async function signOut() {
	try {
		await apiFetch('/api/auth/logout', { method: 'POST' });
	} catch {
		// Signed out locally either way; the server session expires on its own.
	} finally {
		currentUser.set(null);
	}
}
