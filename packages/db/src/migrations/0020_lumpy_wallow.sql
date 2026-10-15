DROP INDEX `link_groups_event_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `link_groups_event_id_unique` ON `link_groups` (`event_id`);