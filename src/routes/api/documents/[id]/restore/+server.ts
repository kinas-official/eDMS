import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/auth/guard';
import { restoreDocument } from '$lib/server/documents/service';
import type { RequestHandler } from './$types';

/** Undoes a soft delete. */
export const POST: RequestHandler = (event) => {
	const user = requirePermission(event, 'delete');
	return json({ document: restoreDocument(user, event.params.id) });
};
