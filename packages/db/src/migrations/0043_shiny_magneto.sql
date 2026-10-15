DROP INDEX `players_active_birth_date_idx`;--> statement-breakpoint
ALTER TABLE `players` ADD `birth_year` integer;--> statement-breakpoint
UPDATE `players` SET `birth_year` = CAST(substr(`birth_date`, 1, 4) AS INTEGER) WHERE `birth_date` IS NOT NULL AND `birth_date` GLOB '[0-9][0-9][0-9][0-9]*';--> statement-breakpoint
CREATE INDEX `players_active_birth_year_idx` ON `players` (`active`,`birth_year`);--> statement-breakpoint
ALTER TABLE `players` DROP COLUMN `birth_date`;--> statement-breakpoint
ALTER TABLE `player_update_requests` ADD `birth_year` integer;--> statement-breakpoint
UPDATE `player_update_requests` SET `birth_year` = CAST(substr(`birth_date`, 1, 4) AS INTEGER) WHERE `birth_date` IS NOT NULL AND `birth_date` GLOB '[0-9][0-9][0-9][0-9]*';--> statement-breakpoint
ALTER TABLE `player_update_requests` DROP COLUMN `nickname`;--> statement-breakpoint
ALTER TABLE `player_update_requests` DROP COLUMN `birth_date`;