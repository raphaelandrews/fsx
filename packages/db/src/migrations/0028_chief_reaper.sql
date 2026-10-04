CREATE TABLE `circuit_final_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`circuit_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`category` text,
	`place` integer NOT NULL,
	`points` real,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "circuit_final_podiums_place_check" CHECK("circuit_final_podiums"."place" BETWEEN 1 AND 1000),
	CONSTRAINT "circuit_final_podiums_points_check" CHECK("circuit_final_podiums"."points" IS NULL OR "circuit_final_podiums"."points" BETWEEN 0 AND 1000000),
	CONSTRAINT "circuit_final_podiums_category_check" CHECK("circuit_final_podiums"."category" IS NULL OR "circuit_final_podiums"."category" IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circuit_final_podium_player` ON `circuit_final_podiums` (`circuit_id`,`player_id`) WHERE "circuit_final_podiums"."category" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `circuit_final_podium_category_player` ON `circuit_final_podiums` (`circuit_id`,`category`,`player_id`) WHERE "circuit_final_podiums"."category" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `circuit_final_podiums_player_idx` ON `circuit_final_podiums` (`player_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tournament_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`place` integer NOT NULL,
	`category` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tournament_podiums_place_check" CHECK("__new_tournament_podiums"."place" BETWEEN 1 AND 100000),
	CONSTRAINT "tournament_podiums_category_check" CHECK("__new_tournament_podiums"."category" IS NULL OR "__new_tournament_podiums"."category" IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
);
--> statement-breakpoint
INSERT INTO `__new_tournament_podiums`("id", "player_id", "tournament_id", "place", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "place", "created_at", "updated_at" FROM `tournament_podiums`;--> statement-breakpoint
DROP TABLE `tournament_podiums`;--> statement-breakpoint
ALTER TABLE `__new_tournament_podiums` RENAME TO `tournament_podiums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`) WHERE "tournament_podiums"."category" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_category_podium` ON `tournament_podiums` (`player_id`,`tournament_id`,`category`) WHERE "tournament_podiums"."category" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);--> statement-breakpoint
ALTER TABLE `circuits` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `circuits` ADD `tier` text DEFAULT 'B' NOT NULL;--> statement-breakpoint
ALTER TABLE `circuits` ADD `championship_id` integer REFERENCES championships(id);--> statement-breakpoint
ALTER TABLE `circuits` ADD `finished_at` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `tier` text DEFAULT 'B' NOT NULL;--> statement-breakpoint
UPDATE `tournaments` SET `tier` = 'S' WHERE `championship_id` IS NOT NULL;--> statement-breakpoint
UPDATE `tournaments` SET `tier` = 'school' WHERE `id` IN (SELECT `circuit_phases`.`tournament_id` FROM `circuit_phases` JOIN `circuits` ON `circuits`.`id` = `circuit_phases`.`circuit_id` WHERE `circuits`.`type` = 'school');--> statement-breakpoint
UPDATE `circuits` SET `tier` = 'school' WHERE `type` = 'school';--> statement-breakpoint
UPDATE `circuits` SET `year` = COALESCE((SELECT CAST(substr(MAX(`tournaments`.`date`), 1, 4) AS INTEGER) FROM `circuit_phases` JOIN `tournaments` ON `tournaments`.`id` = `circuit_phases`.`tournament_id` WHERE `circuit_phases`.`circuit_id` = `circuits`.`id`), CAST(substr(`created_at`, 1, 4) AS INTEGER));
