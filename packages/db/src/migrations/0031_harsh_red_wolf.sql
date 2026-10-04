ALTER TABLE `announcements` ADD `player_id` integer REFERENCES players(id);--> statement-breakpoint
CREATE INDEX `announcements_player_idx` ON `announcements` (`player_id`);