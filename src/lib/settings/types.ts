export type Role = 'admin' | 'editor' | 'viewer';

export const ROLES: Role[] = ['admin', 'editor', 'viewer'];

/** Mirrors the values in `$lib/permissions/rules`, as a union we can index with. */
export type Permission = 'view' | 'upload' | 'approve' | 'delete';

export const PERMISSION_LABELS: { value: Permission; label: string; description: string }[] = [
	{ value: 'view', label: 'View', description: 'Open and read documents' },
	{ value: 'upload', label: 'Upload', description: 'Add new documents and versions' },
	{ value: 'approve', label: 'Approve', description: 'Move documents through the workflow' },
	{ value: 'delete', label: 'Delete', description: 'Remove documents and departments' }
];

export interface GeneralSettings {
	orgName: string;
	supportEmail: string;
	/** Department name, matched against `$lib/departments/store`. */
	defaultDepartment: string;
	timezone: string;
}

export interface DocumentSettings {
	maxUploadSizeMb: number;
	/** Comma-separated extension list as typed by the admin, e.g. ".pdf, .docx". */
	allowedFileTypes: string;
	enableVersioning: boolean;
	requireApproval: boolean;
}

export interface RetentionSettings {
	autoArchiveEnabled: boolean;
	archiveAfterDays: number;
	purgeDeletedAfterDays: number;
}

export interface NotificationSettings {
	notifySubmitted: boolean;
	notifyAssigned: boolean;
	weeklyDigest: boolean;
}

export interface SecuritySettings {
	sessionTimeoutMinutes: number;
	require2fa: boolean;
}

export interface AppSettings {
	general: GeneralSettings;
	documents: DocumentSettings;
	retention: RetentionSettings;
	notifications: NotificationSettings;
	security: SecuritySettings;
	roles: Record<Role, Permission[]>;
}

export const DEFAULT_SETTINGS: AppSettings = {
	general: {
		orgName: 'Acme Corporation',
		supportEmail: 'support@acme.com',
		defaultDepartment: 'HR',
		timezone: 'UTC'
	},
	documents: {
		maxUploadSizeMb: 25,
		allowedFileTypes: '.pdf, .docx, .xlsx, .txt',
		enableVersioning: true,
		requireApproval: true
	},
	retention: {
		autoArchiveEnabled: false,
		archiveAfterDays: 365,
		purgeDeletedAfterDays: 30
	},
	notifications: {
		notifySubmitted: true,
		notifyAssigned: true,
		weeklyDigest: false
	},
	security: {
		sessionTimeoutMinutes: 30,
		require2fa: false
	},
	roles: {
		admin: ['view', 'upload', 'approve', 'delete'],
		editor: ['view', 'upload'],
		viewer: ['view']
	}
};

/**
 * `.pdf, docx , .TXT` -> `['.pdf', '.docx', '.txt']`.
 * Tolerates a missing leading dot and stray whitespace, because the admin types
 * this by hand into a free-text field.
 */
export function parseAllowedTypes(raw: string): string[] {
	return raw
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean)
		.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));
}

/** The same list in the form an `<input type="file" accept>` expects. */
export function toAcceptAttribute(raw: string): string {
	return parseAllowedTypes(raw).join(',');
}

export function fileExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot).toLowerCase();
}
