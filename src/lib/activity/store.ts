import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { browserStorage } from '$lib/storage/browser';
import type { ActivityAction, ActivityLog } from './types';

const STORAGE_KEY = 'activity';

/**
 * Keeps localStorage from growing without bound. The audit log is append-only
 * and nothing prunes it, so cap it at the most recent entries.
 */
const MAX_ENTRIES = 500;

const initial = browser ? ((await browserStorage.get<ActivityLog[]>(STORAGE_KEY)) ?? []) : [];

/** Newest first. */
export const activityLog = writable<ActivityLog[]>(initial);

activityLog.subscribe(async (value) => {
	if (browser) {
		await browserStorage.set(STORAGE_KEY, value);
	}
});

export function logActivity(
	action: ActivityAction,
	options: { actor?: string; details?: string; target?: string; targetId?: string } = {}
): ActivityLog {
	const entry: ActivityLog = {
		id: crypto.randomUUID(),
		action,
		actor: options.actor ?? 'Admin',
		timestamp: new Date().toISOString(),
		details: options.details,
		target: options.target,
		targetId: options.targetId
	};

	activityLog.update((entries) => [entry, ...entries].slice(0, MAX_ENTRIES));

	return entry;
}

export function clearActivityLog() {
	activityLog.set([]);
}

export function replaceActivityLog(next: ActivityLog[] | null) {
	activityLog.set(next ?? []);
}

export { STORAGE_KEY as ACTIVITY_STORAGE_KEY };
