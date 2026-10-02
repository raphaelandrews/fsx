PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_circuit_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`circuit_id` integer,
	`circuit_phase_id` integer,
	`category` text,
	`place` integer,
	`points` real NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`circuit_phase_id`) REFERENCES `circuit_phases`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "circuit_podiums_target_check" CHECK(("__new_circuit_podiums"."circuit_id" IS NULL) <> ("__new_circuit_podiums"."circuit_phase_id" IS NULL)),
	CONSTRAINT "circuit_podiums_points_check" CHECK("__new_circuit_podiums"."points" BETWEEN 0 AND 1000000),
	CONSTRAINT "circuit_podiums_place_check" CHECK("__new_circuit_podiums"."place" IS NULL OR "__new_circuit_podiums"."place" BETWEEN 1 AND 100000)
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_phase_idx` ON `circuit_podiums` (`circuit_phase_id`);--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_idx` ON `circuit_podiums` (`circuit_id`);--> statement-breakpoint
CREATE TABLE `__new_players_to_tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`old_rating` integer NOT NULL,
	`variation` integer NOT NULL,
	`rating_type` text DEFAULT 'rapid' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "players_to_tournaments_old_rating_check" CHECK("__new_players_to_tournaments"."old_rating" BETWEEN 0 AND 4000),
	CONSTRAINT "players_to_tournaments_variation_check" CHECK("__new_players_to_tournaments"."variation" BETWEEN -4000 AND 4000),
	CONSTRAINT "players_to_tournaments_rating_type_check" CHECK("__new_players_to_tournaments"."rating_type" IN ('blitz', 'rapid', 'classic'))
);
--> statement-breakpoint
INSERT INTO `__new_players_to_tournaments`("id", "player_id", "tournament_id", "old_rating", "variation", "rating_type", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "old_rating", "variation", "rating_type", "created_at", "updated_at" FROM `players_to_tournaments`;--> statement-breakpoint
DROP TABLE `players_to_tournaments`;--> statement-breakpoint
ALTER TABLE `__new_players_to_tournaments` RENAME TO `players_to_tournaments`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament` ON `players_to_tournaments` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE TABLE `__new_tournament_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`place` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tournament_podiums_place_check" CHECK("__new_tournament_podiums"."place" BETWEEN 1 AND 100000)
);
--> statement-breakpoint
INSERT INTO `__new_tournament_podiums`("id", "player_id", "tournament_id", "place", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "place", "created_at", "updated_at" FROM `tournament_podiums`;--> statement-breakpoint
DROP TABLE `tournament_podiums`;--> statement-breakpoint
ALTER TABLE `__new_tournament_podiums` RENAME TO `tournament_podiums`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);