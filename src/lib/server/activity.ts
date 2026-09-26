import { db, schema } from '$lib/server/db';

export interface ActivityInput {
	action: string;
	/** Who did it; null for anonymous events such as a failed sign-in. */
	actor: { id: string; name: string } | null;
	/** Label to record when there is no actor, e.g. the username that was tried. */
	actorName?: string;
	targetType?: string;
	targetId?: string;
	target?: string;
	details?: string;
	metadata?: Record<string, unknown>;
}

/** Appends to the audit trail. Entries can't be changed afterwards (see the DB triggers). */
export function logActivity(entry: ActivityInput) {
	db.insert(schema.activityLog)
		.values({
			action: entry.action,
			actorId: entry.actor?.id ?? null,
			actorName: entry.actor?.name ?? entry.actorName ?? 'Unknown',
			targetType: entry.targetType,
			targetId: entry.targetId,
			target: entry.target,
			details: entry.details,
			metadata: entry.metadata
		})
		.run();
}
