import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function readStored(): ThemePreference {
	if (!browser) return 'system';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function apply(pref: ThemePreference) {
	if (!browser) return;
	const isDark =
		pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', isDark);
}

export const themePreference = writable<ThemePreference>(readStored());

export function setTheme(pref: ThemePreference) {
	themePreference.set(pref);
	if (browser) localStorage.setItem(STORAGE_KEY, pref);
	apply(pref);
}

if (browser) {
	apply(readStored());
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		let current: ThemePreference = 'system';
		themePreference.subscribe((v) => (current = v))();
		if (current === 'system') apply('system');
	});
}
