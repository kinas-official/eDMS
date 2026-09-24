import mammoth from 'mammoth';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type PreviewKind = 'pdf' | 'image' | 'docx' | 'text' | 'unsupported';

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.log', '.xml'];

function extension(name: string) {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/**
 * Browsers leave `File.type` empty for some extensions (and on some OSes for
 * .docx), so fall back to the file name.
 */
export function previewKind(file: File): PreviewKind {
	const ext = extension(file.name);
	if (file.type === 'application/pdf' || ext === '.pdf') return 'pdf';
	if (file.type.startsWith('image/')) return 'image';
	if (file.type === DOCX_MIME || ext === '.docx') return 'docx';
	if (file.type.startsWith('text/') || TEXT_EXTENSIONS.includes(ext)) return 'text';
	return 'unsupported';
}

export function isDocx(file: File) {
	return previewKind(file) === 'docx';
}

const STYLE_MAP = [
	"p[style-name='Title'] => h1:fresh",
	"p[style-name='Heading 1'] => h2:fresh",
	"p[style-name='Heading 2'] => h3:fresh",
	"p[style-name='Heading 3'] => h4:fresh",
	'u => u',
	'table => table.fancy-table:fresh'
];

export async function docxToHtml(file: File): Promise<string> {
	const result = await mammoth.convertToHtml(
		{ arrayBuffer: await file.arrayBuffer() },
		{ styleMap: STYLE_MAP }
	);
	return sanitizeHtml(result.value);
}

export async function docxToText(file: File): Promise<string> {
	const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
	return result.value;
}

/**
 * mammoth escapes text, but hyperlinks are copied from the document as-is, so a
 * crafted .docx could carry a `javascript:` link. Strip anything scriptable
 * before the markup reaches {@html}.
 */
function sanitizeHtml(html: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');

	doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());

	for (const el of doc.body.querySelectorAll('*')) {
		for (const attr of [...el.attributes]) {
			const name = attr.name.toLowerCase();
			const value = attr.value.trim().toLowerCase();
			if (name.startsWith('on')) el.removeAttribute(attr.name);
			if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
				el.removeAttribute(attr.name);
			}
		}
		if (el.tagName === 'A') {
			el.setAttribute('target', '_blank');
			el.setAttribute('rel', 'noopener noreferrer');
		}
	}

	return doc.body.innerHTML;
}

export function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
