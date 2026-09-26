import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { browserStorage } from '$lib/storage/browser';
import { DEFAULT_SETTINGS, withDefaults, type AppSettings } from './types';

const STORAGE_KEY = 'settings';

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
