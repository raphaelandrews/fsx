CREATE TABLE `change_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`entity` text NOT NULL,
	`record_id` integer NOT NULL,
	`label` text NOT NULL,
	`action` text NOT NULL,
	`procedure` text NOT NULL,
	`changes` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "change_log_entity_check" CHECK("change_log"."entity" IN ('player', 'tournament', 'podium')),
	CONSTRAINT "change_log_action_check" CHECK("change_log"."action" IN ('create', 'update', 'delete'))
);
--> statement-breakpoint
CREATE INDEX `change_log_record_idx` ON `change_log` (`entity`,`record_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `change_log_created_idx` ON `change_log` (`created_at`);