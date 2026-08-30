import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { browserStorage } from '$lib/storage/browser';
import type { Department } from './types';

const STORAGE_KEY = 'departments';

/**
 * Seed data, used only when nothing has been saved yet. This list used to live
 * inside the departments page while every other page hardcoded its own copy as
 * `<option>` elements; the store is now the single source for both.
 */
const SEED_DEPARTMENTS: Department[] = [
	{
		id: 1,
		name: 'HR',
		description: 'Human Resources',
		createdAt: '2024-12-10',
		members: [
			{ id: 1, name: 'Jane Santos', email: 'jane@company.com' },
			{ id: 2, name: 'Mark Reyes', email: 'mark@company.com' }
		]
	},
	{
		id: 2,
		name: 'IT',
		description: 'Information Technology',
		createdAt: '2024-12-12',
		members: [{ id: 3, name: 'Paul Cruz', email: 'paul@company.com' }]
	},
	{
		id: 3,
		name: 'Finance',
		description: 'Finance & Accounting',
		createdAt: '2024-12-15',
		members: []
	}
];

const initial = browser
	? ((await browserStorage.get<Department[]>(STORAGE_KEY)) ?? SEED_DEPARTMENTS)
	: SEED_DEPARTMENTS;

export const departments = writable<Department[]>(initial);

departments.subscribe(async (value) => {
	if (browser) {
		await browserStorage.set(STORAGE_KEY, value);
	}
});

/** Just the names, for the filter and form dropdowns across the admin pages. */
export const departmentNames = derived(departments, ($departments) =>
	$departments.map((d) => d.name)
);

export function addDepartment(name: string, description: string) {
	departments.update((list) => [
		...list,
		{
			id: Date.now(),
			name,
			description,
			createdAt: new Date().toISOString().split('T')[0],
			members: []
		}
	]);
}

export function updateDepartment(id: number, partial: Partial<Department>) {
	departments.update((list) => list.map((d) => (d.id === id ? { ...d, ...partial } : d)));
}

export function removeDepartment(id: number) {
	departments.update((list) => list.filter((d) => d.id !== id));
}

export function replaceDepartments(next: Department[] | null) {
	departments.set(next ?? SEED_DEPARTMENTS);
}

export { STORAGE_KEY as DEPARTMENTS_STORAGE_KEY };
