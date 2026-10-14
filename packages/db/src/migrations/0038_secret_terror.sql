ALTER TABLE `events` ADD `end_date` text;--> statement-breakpoint
ALTER TABLE `events` ADD `venue` text;--> statement-breakpoint
ALTER TABLE `events` ADD `tournament_id` integer REFERENCES tournaments(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `events_tournament_idx` ON `events` (`tournament_id`);