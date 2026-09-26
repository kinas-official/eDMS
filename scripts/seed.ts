/**
 * First-run setup: applies migrations, then creates the default departments,
 * app settings and an admin account if they don't exist yet. Safe to re-run.
 *
 *   npm run db:seed              # admin only
 *   npm run db:seed -- --demo    # also an editor and a viewer, for trying out roles
 *
 * The admin comes from ADMIN_USERNAME / ADMIN_PASSWORD. Any account without a
 * configured password gets a random one, printed once.
 */
import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { openDatabase, runMigrations } from '../src/lib/server/db/client.ts';
import { departments, settings, users, type Role } from '../src/lib/server/db/schema.ts';
import { hashPassword } from '../src/lib/server/auth/password.ts';
import { DEFAULT_SETTINGS } from '../src/lib/settings/types.ts';

const db = openDatabase(process.env.DATABASE_URL ?? 'data/edms.db');
runMigrations(db);

const DEFAULT_DEPARTMENTS = [
	{ name: 'HR', description: 'Human Resources' },
	{ name: 'IT', description: 'Information Technology' },
	{ name: 'Finance', description: 'Finance & Accounting' },
	{ name: 'Legal', description: 'Legal & Compliance' }
];

const createdDepartments = db
	.insert(departments)
	.values(DEFAULT_DEPARTMENTS)
	.onConflictDoNothing()
	.returning()
	.all();
console.log(`Departments created: ${createdDepartments.length}`);

db.insert(settings).values({ key: 'app', value: DEFAULT_SETTINGS }).onConflictDoNothing().run();

let generatedAny = false;

async function ensureUser(opts: {
	username: string;
	name: string;
	role: Role;
	department: string;
	password?: string;
}) {
	const existing = db
		.select({ id: users.id })
		.from(users)
		.where(eq(sql`lower(${users.username})`, opts.username.toLowerCase()))
		.get();
	if (existing) {
		console.log(`User "${opts.username}" already exists; left unchanged.`);
		return;
	}

	const password = opts.password || randomBytes(12).toString('base64url');
	if (!opts.password) generatedAny = true;
	const department = db
		.select({ id: departments.id })
		.from(departments)
		.where(eq(departments.name, opts.department))
		.get();

	db.insert(users)
		.values({
			username: opts.username,
			name: opts.name,
			passwordHash: await hashPassword(password),
			role: opts.role,
			departmentId: department?.id ?? null
		})
		.run();

	console.log(
		opts.password
			? `User "${opts.username}" (${opts.role}) created with the configured password.`
			: `User "${opts.username}" (${opts.role}) created with password: ${password}`
	);
}

await ensureUser({
	username: process.env.ADMIN_USERNAME || 'admin',
	name: 'Administrator',
	role: 'admin',
	department: 'IT',
	password: process.env.ADMIN_PASSWORD
});

if (process.argv.includes('--demo')) {
	await ensureUser({ username: 'editor1', name: 'Demo Editor', role: 'editor', department: 'HR' });
	await ensureUser({
		username: 'viewer1',
		name: 'Demo Viewer',
		role: 'viewer',
		department: 'Finance'
	});
}

if (generatedAny) console.log('Generated passwords are shown only once; store them now.');
