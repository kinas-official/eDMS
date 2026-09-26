import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/auth/guard';
import {
	deleteDocument,
	getDocumentDetail,
	parseDocumentUpdate,
	updateDocument
} from '$lib/server/documents/service';
import type { RequestHandler } from './$types';

/** The document with every version, oldest first. */
export const GET: RequestHandler = (event) => {
	const user = requirePermission(event, 'view');
	return json({ document: getDocumentDetail(user, event.params.id) });
};

/**
 * JSON body with any of `title`, `description`, `status`, `departmentId`,
 * `assigneeId`. Metadata edits don't create a version; they're recorded in
 * the audit log with a before/after diff.
 */
export const PATCH: RequestHandler = async (event) => {
	// Beyond `view`, what's needed depends on the fields changed; the service decides.
	const user = requirePermission(event, 'view');
	const update = parseDocumentUpdate(await event.request.json().catch(() => null));
	return json({ document: updateDocument(user, event.params.id, update) });
};

/** Soft delete; see POST ./restore. */
export const DELETE: RequestHandler = (event) => {
	const user = requirePermission(event, 'delete');
	deleteDocument(user, event.params.id);
	return new Response(null, { status: 204 });
};
