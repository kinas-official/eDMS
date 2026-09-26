/**
 * Sign-in throttling, kept in memory: a single LAN server doesn't need
 * anything shared, and a restart clearing the counters is acceptable.
 * Keyed by client address + username, so one person mistyping doesn't lock
 * out everyone else behind the same NAT.
 */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;

const failures = new Map<string, { count: number; resetAt: number }>();

/** Milliseconds until the key may try again, or 0 if it isn't blocked. */
export function loginBlockedFor(key: string): number {
	const entry = failures.get(key);
	if (!entry) return 0;
	const remaining = entry.resetAt - Date.now();
	if (remaining <= 0) {
		failures.delete(key);
		return 0;
	}
	return entry.count >= MAX_FAILURES ? remaining : 0;
}

export function recordLoginFailure(key: string) {
	const now = Date.now();
	const entry = failures.get(key);
	if (entry && entry.resetAt > now) {
		entry.count++;
	} else {
		failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
	}

	if (failures.size > 10_000) {
		for (const [k, v] of failures) if (v.resetAt <= now) failures.delete(k);
	}
}

export function clearLoginFailures(key: string) {
	failures.delete(key);
}
