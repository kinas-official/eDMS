-- The audit trail is append-only: no endpoint bug (or SQL console) can rewrite
-- or erase history.
--
-- The one UPDATE allowed is the `actor_id -> NULL` that ON DELETE SET NULL
-- performs when a user is removed; without it, users with any activity could
-- never be deleted. `actor_name` keeps the entry readable afterwards.
CREATE TRIGGER `activity_log_no_update`
BEFORE UPDATE ON `activity_log`
WHEN NOT (
	NEW.`actor_id` IS NULL
	AND NEW.`id` = OLD.`id`
	AND NEW.`action` = OLD.`action`
	AND NEW.`actor_name` = OLD.`actor_name`
	AND NEW.`target_type` IS OLD.`target_type`
	AND NEW.`target_id` IS OLD.`target_id`
	AND NEW.`target` IS OLD.`target`
	AND NEW.`details` IS OLD.`details`
	AND NEW.`metadata` IS OLD.`metadata`
	AND NEW.`created_at` = OLD.`created_at`
)
BEGIN
	SELECT RAISE(ABORT, 'activity_log is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER `activity_log_no_delete`
BEFORE DELETE ON `activity_log`
BEGIN
	SELECT RAISE(ABORT, 'activity_log is append-only');
END;
