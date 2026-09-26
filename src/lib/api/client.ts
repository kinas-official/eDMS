import { getApiBaseUrl } from '$lib/config/env';

/** A non-2xx response; `message` is the server's `{ message }` when it sent one. */
export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

let unauthorizedHandler: (() => void) | null = null;

/** Lets the auth store react when the server reports the session is gone. */
export function onUnauthorized(handler: () => void) {
	unauthorizedHandler = handler;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const headers = new Headers(options.headers);
	headers.set('Accept', 'application/json');
	// Only for JSON strings: a FormData upload must let the browser set its own boundary.
	if (typeof options.body === 'string' && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const res = await fetch(`${getApiBaseUrl()}${path}`, {
		credentials: 'include',
		...options,
		headers
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		if (res.status === 401) unauthorizedHandler?.();
		throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
	}

	return res.json() as Promise<T>;
}
