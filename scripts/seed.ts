/**
 * First-run setup: applies migrations, then creates the default departments,
 * app settings and an admin account if they don't exist yet. Safe to re-run.
 *
 *   npm run db:seed
 *
 * The admin comes from ADMIN_USERNAME / ADMIN_PASSWORD. If no password is set,
 * a random one is generated and printed once.
 */
import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { openDatabase, runMigrations } from '../src/lib/server/db/client.ts';
import { departments, settings, users } from '../src/lib/server/db/schema.ts';
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

db.insert(settings).values({ key: 'app', value: DEFAULT_SETTINGS }).onConflictDoNothing().run();

const username = process.env.ADMIN_USERNAME ?? 'admin';
const existing = db
	.select({ id: users.id })
	.from(users)
	.where(eq(sql`lower(${users.username})`, username.toLowerCase()))
	.get();

let generatedPassword: string | null = null;

if (!existing) {
	const password =
		process.env.ADMIN_PASSWORD || (generatedPassword = randomBytes(12).toString('base64url'));
	const it = db
		.select({ id: departments.id })
		.from(departments)
		.where(eq(departments.name, 'IT'))
		.get();

	db.insert(users)
		.values({
			username,
			name: 'Administrator',
			passwordHash: await hashPassword(password),
			role: 'admin',
			departmentId: it?.id ?? null
		})
		.run();
}

console.log(`Departments created: ${createdDepartments.length}`);
if (existing) {
	console.log(`Admin "${username}" already exists; left unchanged.`);
} else if (generatedPassword) {
	console.log(`Admin "${username}" created with password: ${generatedPassword}`);
	console.log('Store it now; it will not be shown again.');
} else {
	console.log(`Admin "${username}" created with the password from ADMIN_PASSWORD.`);
}
