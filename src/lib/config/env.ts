/**
 * Base URL for API calls. Empty means same origin, which is how the web app
 * is served. The desktop app will set this to the server address the user
 * picks, since its bundled UI doesn't live on the server.
 */
let apiBaseUrl = '';

export function getApiBaseUrl(): string {
	return apiBaseUrl;
}

export function setApiBaseUrl(url: string) {
	apiBaseUrl = url.replace(/\/+$/, '');
}
