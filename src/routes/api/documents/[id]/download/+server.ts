import { error } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { requirePermission } from '$lib/server/auth/guard';
import { getVersionForDownload } from '$lib/server/documents/service';
import { openFile } from '$lib/server/storage/files';
import type { RequestHandler } from './$types';

/**
 * Types the browser may render in place for the preview. Anything else, HTML
 * and SVG especially, is always sent as an attachment: shown inline on this
 * origin, an uploaded page could run script with the viewer's session.
 */
const INLINE_TYPES = new Set([
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'text/plain'
]);

/**
 * Query: `version` (number, defaults to the latest) and `inline=true` for
 * previews. Every call is recorded in the audit log.
 */
export const GET: RequestHandler = async (event) => {
	const user = requirePermission(event, 'view');
	const raw = event.url.searchParams.get('version');
	const versionNumber = raw === null ? undefined : Number(raw);
	if (versionNumber !== undefined && !Number.isInteger(versionNumber)) {
		error(400, 'version must be a whole number');
	}

	const { document, version } = getVersionForDownload(user, event.params.id, versionNumber);
	const file = await openFile(version.storageKey);
	if (!file) error(410, 'The file for this version is missing from storage');

	const inline =
		event.url.searchParams.get('inline') === 'true' && INLINE_TYPES.has(version.mimeType);

	logActivity({
		action: 'downloaded',
		actor: user,
		targetType: 'document',
		targetId: document.id,
		target: document.title,
		details: `${inline ? 'Previewed' : 'Downloaded'} version ${version.versionNumber}`
	});

	const headers = new Headers({
		'Content-Type': inline ? version.mimeType : 'application/octet-stream',
		'Content-Length': String(file.size),
		'Content-Disposition': contentDisposition(inline, version.originalName),
		'X-Content-Type-Options': 'nosniff',
		'Cache-Control': 'private, no-store',
		ETag: `"${version.sha256}"`
	});
	// Belt and braces: no script or same-origin access. Chrome won't render a PDF
	// under a sandbox, and its viewer doesn't run document script on this origin anyway.
	if (version.mimeType !== 'application/pdf') headers.set('Content-Security-Policy', 'sandbox');

	return new Response(file.stream, { headers });
};

/** RFC 6266: an ASCII fallback plus the real name in UTF-8. */
function contentDisposition(inline: boolean, name: string) {
	const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
	return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
