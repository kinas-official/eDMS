import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Server-side source of truth. The UI still has its own `types.ts` files under
 * `$lib`; those get reconciled with these as each page moves onto the API.
 */

export const ROLES = ['admin', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'inactive'] as const;

/** Union of the Documents page (Draft/Pending/Approved/Rejected) and Workflow (…/Reviewed) states. */
export const DOCUMENT_STATUSES = ['draft', 'pending', 'reviewed', 'approved', 'rejected'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('subsec') * 1000)`);

const updatedAt = () =>
	integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('subsec') * 1000)`)
		.$onUpdate(() => new Date());

export const departments = sqliteTable('departments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	description: text('description').notNull().default(''),
	createdAt: createdAt()
});

export const users = sqliteTable(
	'users',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		username: text('username').notNull(),
		name: text('name').notNull(),
		email: text('email'),
		passwordHash: text('password_hash').notNull(),
		role: text('role', { enum: ROLES }).notNull().default('viewer'),
		status: text('status', { enum: USER_STATUSES }).notNull().default('active'),
		departmentId: integer('department_id').references(() => departments.id, {
			onDelete: 'set null'
		}),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		// Case-insensitive: "Admin" and "admin" must not be two accounts.
		uniqueIndex('users_username_unique').on(sql`lower(${t.username})`),
		uniqueIndex('users_email_unique').on(sql`lower(${t.email})`)
	]
);

/**
 * `id` is the SHA-256 of the session token, never the token itself, so a
 * leaked database can't be replayed as live sessions.
 */
export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: createdAt()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const documents = sqliteTable(
	'documents',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		/** Human-facing code shown in the UI, e.g. `HR-2024-091`. */
		reference: text('reference').notNull().unique(),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		status: text('status', { enum: DOCUMENT_STATUSES }).notNull().default('draft'),
		departmentId: integer('department_id').references(() => departments.id, {
			onDelete: 'set null'
		}),
		ownerId: text('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		/** Current reviewer on the Workflow board. */
		assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
		/** Soft delete; a purge removes the row and its files. */
		deletedAt: integer('deleted_at', { mode: 'timestamp_ms' })
	},
	(t) => [
		index('documents_department_idx').on(t.departmentId),
		index('documents_status_idx').on(t.status)
	]
);

/**
 * One row per uploaded file revision. Metadata-only edits (title, status, …)
 * don't create a version; they're recorded in the activity log with a diff.
 */
export const documentVersions = sqliteTable(
	'document_versions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.id, { onDelete: 'cascade' }),
		versionNumber: integer('version_number').notNull(),
		/** Server-generated file name inside the storage dir; never derived from user input. */
		storageKey: text('storage_key').notNull().unique(),
		originalName: text('original_name').notNull(),
		mimeType: text('mime_type').notNull(),
		size: integer('size').notNull(),
		sha256: text('sha256').notNull(),
		/** Plain text pulled from DOCX/TXT, for content diffs and later full-text search. */
		extractedText: text('extracted_text'),
		note: text('note').notNull().default(''),
		uploadedById: text('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('document_versions_doc_number_unique').on(t.documentId, t.versionNumber)]
);

/**
 * Append-only audit trail: triggers in the migrations reject UPDATE and
 * DELETE. `actorName` is copied in so entries stay readable after the user is
 * removed.
 */
export const activityLog = sqliteTable(
	'activity_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		action: text('action').notNull(),
		actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
		actorName: text('actor_name').notNull(),
		targetType: text('target_type'),
		targetId: text('target_id'),
		/** Human-readable label for the target at the time, e.g. the document title. */
		target: text('target'),
		details: text('details'),
		/** Structured extras, e.g. `{ changes: { status: ['draft', 'pending'] } }`. */
		metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
		createdAt: createdAt()
	},
	(t) => [
		index('activity_target_idx').on(t.targetType, t.targetId),
		index('activity_created_idx').on(t.createdAt)
	]
);

/** Key/value store; the whole `AppSettings` object lives under the `app` key. */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value', { mode: 'json' }).notNull(),
	updatedAt: updatedAt()
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type ActivityEntry = typeof activityLog.$inferSelect;
