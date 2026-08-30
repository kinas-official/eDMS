import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { browserStorage } from '$lib/storage/browser';
import { DEFAULT_SETTINGS, type AppSettings } from './types';

const STORAGE_KEY = 'settings';

/**
 * Section-wise merge over the defaults. A plain spread of the stored object
 * would leave any key added in a later release `undefined` for everyone who
 * already has settings saved, which surfaces as blank inputs and NaN numbers.
 */
function withDefaults(stored: Partial<AppSettings> | null): AppSettings {
	if (!stored) return structuredClone(DEFAULT_SETTINGS);

	return {
		general: { ...DEFAULT_SETTINGS.general, ...stored.general },
		documents: { ...DEFAULT_SETTINGS.documents, ...stored.documents },
		retention: { ...DEFAULT_SETTINGS.retention, ...stored.retention },
		notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
		security: { ...DEFAULT_SETTINGS.security, ...stored.security },
		roles: { ...DEFAULT_SETTINGS.roles, ...stored.roles }
	};
}

const initial = browser
	? withDefaults(await browserStorage.get<Partial<AppSettings>>(STORAGE_KEY))
	: structuredClone(DEFAULT_SETTINGS);

export const settings = writable<AppSettings>(initial);

settings.subscribe(async (value) => {
	if (browser) {
		await browserStorage.set(STORAGE_KEY, value);
	}
});

export function resetSettings() {
	settings.set(structuredClone(DEFAULT_SETTINGS));
}

/** Used by the backup/restore section, which writes a whole settings object at once. */
export function replaceSettings(next: Partial<AppSettings> | null) {
	settings.set(withDefaults(next));
}

export { STORAGE_KEY as SETTINGS_STORAGE_KEY };
