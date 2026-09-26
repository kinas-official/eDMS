// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthUser } from '$lib/auth/types';
import type { Session } from '$lib/server/db/schema';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by `hooks.server.ts` from the session cookie or Bearer token. */
			user: AuthUser | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
