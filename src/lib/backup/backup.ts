import { get } from 'svelte/store';
import { documents } from '$lib/documents/store';
import type { DocumentMeta } from '$lib/documents/types';
import { departments, replaceDepartments } from '$lib/departments/store';
import type { Department } from '$lib/departments/types';
import { activityLog, replaceActivityLog } from '$lib/activity/store';
import type { ActivityLog } from '$lib/activity/types';
import { settings, replaceSettings } from '$lib/settings/store';
import type { AppSettings } from '$lib/settings/types';

const FORMAT_VERSION = 1;

export interface BackupPayload {
	app: 'edms';
	version: number;
	exportedAt: string;
	data: {
		settings: AppSettings;
		documents: DocumentMeta[];
		departments: Department[];
		activity: ActivityLog[];
	};
}

/**
 * Only the stores that are actually persisted are included. The users and
 * workflow pages still hold page-local mock arrays that reset on reload, so
 * there is nothing durable to capture for them yet.
 */
export function buildBackup(): BackupPayload {
	return {
		app: 'edms',
		version: FORMAT_VERSION,
		exportedAt: new Date().toISOString(),
		data: {
			settings: get(settings),
			documents: get(documents),
			departments: get(departments),
			activity: get(activityLog)
		}
	};
}

export async function downloadBackup() {
	const { saveAs } = await import('file-saver');
	const payload = buildBackup();
	const stamp = payload.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: 'application/json;charset=utf-8'
	});
	saveAs(blob, `edms-backup-${stamp}.json`);
}

/** Throws with a message suitable for showing to the admin. */
export function parseBackup(text: string): BackupPayload {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error('That file is not valid JSON.');
	}

	const payload = parsed as Partial<BackupPayload>;

	if (!payload || payload.app !== 'edms' || typeof payload.data !== 'object' || !payload.data) {
		throw new Error('That file is not an rDMS backup.');
	}
	if (payload.version !== FORMAT_VERSION) {
		throw new Error(
			`Backup format v${payload.version} cannot be read by this version (expected v${FORMAT_VERSION}).`
		);
	}

	return payload as BackupPayload;
}

export function applyBackup(payload: BackupPayload) {
	replaceSettings(payload.data.settings ?? null);
	replaceDepartments(payload.data.departments ?? null);
	replaceActivityLog(payload.data.activity ?? null);
	documents.set(payload.data.documents ?? []);
}

export function describeBackup(payload: BackupPayload): string {
	const { documents: docs, departments: deps, activity } = payload.data;
	return `${deps?.length ?? 0} departments, ${docs?.length ?? 0} documents, ${activity?.length ?? 0} log entries, exported ${new Date(payload.exportedAt).toLocaleString()}`;
}
