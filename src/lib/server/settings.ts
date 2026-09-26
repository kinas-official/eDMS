import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { withDefaults, type AppSettings } from '$lib/settings/types';

/** The organization's settings as stored by the server (seeded from `DEFAULT_SETTINGS`). */
export function getAppSettings(): AppSettings {
	const row = db
		.select({ value: schema.settings.value })
		.from(schema.settings)
		.where(eq(schema.settings.key, 'app'))
		.get();
	return withDefaults(row?.value as Partial<AppSettings> | undefined);
}
