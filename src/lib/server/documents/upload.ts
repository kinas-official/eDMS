import { error } from '@sveltejs/kit';
import mammoth from 'mammoth';
import { fileExtension, parseAllowedTypes, type AppSettings } from '$lib/settings/types';

const MB = 1024 * 1024;

/**
 * Preferred over the type the client sends: the extension is what the
 * allowlist checked, and browsers send `application/octet-stream` (or
 * nothing) for types the OS doesn't know, .docx included on some systems.
 */
const MIME_BY_EXTENSION: Record<string, string> = {
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.txt': 'text/plain',
	'.md': 'text/markdown',
	'.csv': 'text/csv',
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.log': 'text/plain',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp'
};

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.xml', '.log']);

/** Enough for any real document's diff; keeps a huge log file from bloating the row. */
const MAX_EXTRACTED_CHARS = 1_000_000;

export interface Upload {
	bytes: Uint8Array;
	originalName: string;
	mimeType: string;
	form: FormData;
}

/**
 * Reads a multipart body with a `file` field and checks it against the
 * upload limits in Settings. The dropzone checks the same rules, but only the
 * server's check counts.
 */
export async function readUpload(request: Request, settings: AppSettings): Promise<Upload> {
	const { maxUploadSizeMb, allowedFileTypes } = settings.documents;
	const maxBytes = maxUploadSizeMb > 0 ? maxUploadSizeMb * MB : Infinity;

	// Reject oversized bodies before buffering them; 1 MB covers the other form fields.
	const declared = Number(request.headers.get('content-length'));
	if (declared && declared > maxBytes + MB) {
		error(413, `Files can be at most ${maxUploadSizeMb} MB`);
	}

	const form = await request.formData().catch(() => null);
	if (!form) error(400, 'Expected a multipart/form-data body');

	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0) error(400, 'Attach a non-empty file as "file"');

	const originalName = cleanFileName(file.name);
	const ext = fileExtension(originalName);

	const allowed = parseAllowedTypes(allowedFileTypes);
	if (allowed.length && !allowed.includes(ext)) {
		error(415, `${ext || 'Files without an extension'} are not allowed (${allowed.join(', ')})`);
	}
	if (file.size > maxBytes) error(413, `Files can be at most ${maxUploadSizeMb} MB`);

	return {
		bytes: new Uint8Array(await file.arrayBuffer()),
		originalName,
		mimeType: mimeTypeFor(ext, file.type),
		form
	};
}

function mimeTypeFor(ext: string, sent: string) {
	const type = sent.split(';')[0].trim().toLowerCase();
	return MIME_BY_EXTENSION[ext] || type || 'application/octet-stream';
}

/** Only the last path segment, without control characters, at a sane length. */
function cleanFileName(name: string) {
	const base = name.split(/[\\/]/).pop() ?? '';
	// eslint-disable-next-line no-control-regex
	const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
	return cleaned.slice(-255) || 'file';
}

/**
 * Plain text for the Change History diff (and later full-text search). Other
 * types return null: read as text they'd be binary noise.
 */
export async function extractText(upload: Upload): Promise<string | null> {
	const ext = fileExtension(upload.originalName);
	try {
		let text: string | null = null;
		if (ext === '.docx') {
			text = (await mammoth.extractRawText({ buffer: Buffer.from(upload.bytes) })).value;
		} else if (TEXT_EXTENSIONS.has(ext) || upload.mimeType.startsWith('text/')) {
			text = new TextDecoder('utf-8', { fatal: true }).decode(upload.bytes);
			if (text.includes('\u0000')) text = null;
		}
		return text === null ? null : text.slice(0, MAX_EXTRACTED_CHARS);
	} catch {
		// Unreadable or not really text: keep the upload, just without a content diff.
		return null;
	}
}

/** A trimmed string form field, or undefined when it's absent. */
export function formText(form: FormData, name: string, maxLength: number) {
	const value = form.get(name);
	if (value === null) return undefined;
	if (typeof value !== 'string') error(400, `"${name}" must be text`);
	const trimmed = value.trim();
	if (trimmed.length > maxLength) error(400, `"${name}" can be at most ${maxLength} characters`);
	return trimmed;
}
