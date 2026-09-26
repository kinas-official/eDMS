import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/auth/guard';
import { addVersion, NOTE_MAX } from '$lib/server/documents/service';
import { formText, readUpload } from '$lib/server/documents/upload';
import { getAppSettings } from '$lib/server/settings';
import type { RequestHandler } from './$types';

/**
 * Multipart: `file` (required) and an optional `note`. With "Enable
 * versioning" off in Settings, this replaces the current file instead.
 */
export const POST: RequestHandler = async (event) => {
	const user = requirePermission(event, 'upload');
	const upload = await readUpload(event.request, getAppSettings());
	const note = formText(upload.form, 'note', NOTE_MAX) ?? '';
	const document = await addVersion(user, event.params.id, upload, note);
	return json({ document }, { status: 201 });
};
