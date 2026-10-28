ALTER TABLE `circuit_results` ADD `club_id` integer REFERENCES clubs(id);--> statement-breakpoint
CREATE INDEX `circuit_results_club_idx` ON `circuit_results` (`club_id`);--> statement-breakpoint
UPDATE `circuit_results` SET `club_id` = (SELECT `club_id` FROM `players` WHERE `players`.`id` = `circuit_results`.`player_id`);
