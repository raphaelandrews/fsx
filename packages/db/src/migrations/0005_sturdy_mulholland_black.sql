PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_circuit_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`circuit_phase_id` integer NOT NULL,
	`category` text,
	`place` integer,
	`points` real NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`circuit_phase_id`) REFERENCES `circuit_phases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_cup_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`cup_group_id` integer NOT NULL,
	`nickname` text,
	`position` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`cup_group_id`) REFERENCES `cup_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_players`("id", "player_id", "cup_group_id", "nickname", "position", "created_at", "updated_at") SELECT "id", "player_id", "cup_group_id", "nickname", "position", "created_at", "updated_at" FROM `cup_players`;--> statement-breakpoint
DROP TABLE `cup_players`;--> statement-breakpoint
ALTER TABLE `__new_cup_players` RENAME TO `cup_players`;--> statement-breakpoint
CREATE TABLE `__new_defending_champions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`championship_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_defending_champions`("id", "player_id", "championship_id", "created_at", "updated_at") SELECT "id", "player_id", "championship_id", "created_at", "updated_at" FROM `defending_champions`;--> statement-breakpoint
DROP TABLE `defending_champions`;--> statement-breakpoint
ALTER TABLE `__new_defending_champions` RENAME TO `defending_champions`;--> statement-breakpoint
CREATE UNIQUE INDEX `defending_champion` ON `defending_champions` (`player_id`,`championship_id`);--> statement-breakpoint
CREATE TABLE `__new_players_to_tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`old_rating` integer NOT NULL,
	`variation` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_to_tournaments`("id", "player_id", "tournament_id", "old_rating", "variation", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "old_rating", "variation", "created_at", "updated_at" FROM `players_to_tournaments`;--> statement-breakpoint
DROP TABLE `players_to_tournaments`;--> statement-breakpoint
ALTER TABLE `__new_players_to_tournaments` RENAME TO `players_to_tournaments`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament` ON `players_to_tournaments` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE TABLE `__new_school_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`club_id` integer NOT NULL,
	`player_id` integer,
	`team_name` text,
	`age_group` text NOT NULL,
	`sex` text NOT NULL,
	`modality` text NOT NULL,
	`place` integer NOT NULL,
	`points` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_school_results`("id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at") SELECT "id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at" FROM `school_results`;--> statement-breakpoint
DROP TABLE `school_results`;--> statement-breakpoint
ALTER TABLE `__new_school_results` RENAME TO `school_results`;--> statement-breakpoint
CREATE INDEX `school_results_age_sex_modality_idx` ON `school_results` (`age_group`,`sex`,`modality`);--> statement-breakpoint
CREATE INDEX `school_results_club_age_idx` ON `school_results` (`club_id`,`age_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `school_results_individual_unique_idx` ON `school_results` (`player_id`,`age_group`,`sex`);--> statement-breakpoint
CREATE UNIQUE INDEX `school_results_team_unique_idx` ON `school_results` (`club_id`,`age_group`,`sex`,`team_name`);--> statement-breakpoint
CREATE TABLE `__new_tournament_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`place` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tournament_podiums`("id", "player_id", "tournament_id", "place", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "place", "created_at", "updated_at" FROM `tournament_podiums`;--> statement-breakpoint
DROP TABLE `tournament_podiums`;--> statement-breakpoint
ALTER TABLE `__new_tournament_podiums` RENAME TO `tournament_podiums`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);