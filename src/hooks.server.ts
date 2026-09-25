import type { Handle, ServerInit } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { db, runMigrations } from '$lib/server/db';

// Bring the schema up to date before the first request, so deploying a new
// build onto an existing LAN server needs no separate migrate step.
export const init: ServerInit = () => {
	runMigrations(db);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = handleParaglide;
