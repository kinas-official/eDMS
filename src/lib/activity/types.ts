export type ActivityAction =
	| 'created'
	| 'edited'
	| 'approved'
	| 'rejected'
	| 'deleted'
	| 'restored'
	| 'archived'
	| 'purged';

export const ACTIVITY_ACTIONS: ActivityAction[] = [
	'created',
	'edited',
	'approved',
	'rejected',
	'deleted',
	'restored',
	'archived',
	'purged'
];

export interface ActivityLog {
	id: string;
	action: ActivityAction;
	actor: string;
	timestamp: string;
	details?: string;
	/**
	 * What the action was performed on. The per-document trail never needed this
	 * because context was implied, but a system-wide log is unreadable without it.
	 */
	target?: string;
	targetId?: string;
}
