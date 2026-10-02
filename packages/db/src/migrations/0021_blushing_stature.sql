CREATE TABLE `rate_limits` (
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`key`, `window_start`)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "name", "start_date", "created_at", "updated_at") SELECT "id", "name", "start_date", "created_at", "updated_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `events_name_unique` ON `events` (`name`);--> statement-breakpoint
CREATE INDEX `events_start_date_idx` ON `events` (`start_date`);--> statement-breakpoint
CREATE TABLE `__new_announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT "announcements_year_check" CHECK("__new_announcements"."year" BETWEEN 1900 AND 2200),
	CONSTRAINT "announcements_number_check" CHECK("__new_announcements"."number" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_announcements`("id", "year", "number", "content", "created_at", "updated_at") SELECT "id", "year", "number", "content", "created_at", "updated_at" FROM `announcements`;--> statement-breakpoint
DROP TABLE `announcements`;--> statement-breakpoint
ALTER TABLE `__new_announcements` RENAME TO `announcements`;--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_content_unique` ON `announcements` (`content`);--> statement-breakpoint
CREATE UNIQUE INDEX `year_number` ON `announcements` (`year`,`number`);--> statement-breakpoint
CREATE TABLE `__new_circuit_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`circuit_id` integer,
	`circuit_phase_id` integer,
	`category` text,
	`place` integer,
	`points` real NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`circuit_phase_id`) REFERENCES `circuit_phases`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "circuit_podiums_target_check" CHECK(("__new_circuit_podiums"."circuit_id" IS NULL) <> ("__new_circuit_podiums"."circuit_phase_id" IS NULL)),
	CONSTRAINT "circuit_podiums_points_check" CHECK("__new_circuit_podiums"."points" >= 0),
	CONSTRAINT "circuit_podiums_place_check" CHECK("__new_circuit_podiums"."place" IS NULL OR "__new_circuit_podiums"."place" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_phase_idx` ON `circuit_podiums` (`circuit_phase_id`);--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_idx` ON `circuit_podiums` (`circuit_id`);--> statement-breakpoint
CREATE TABLE `__new_cups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`prize_pool` integer NOT NULL,
	`rating_type` text NOT NULL,
	`championship_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cups_prize_pool_non_negative_check" CHECK("__new_cups"."prize_pool" >= 0),
	CONSTRAINT "cups_rating_type_check" CHECK("__new_cups"."rating_type" IN ('blitz', 'rapid', 'classic'))
);
--> statement-breakpoint
INSERT INTO `__new_cups`("id", "name", "image_url", "start_date", "end_date", "prize_pool", "rating_type", "championship_id", "created_at", "updated_at") SELECT "id", "name", "image_url", "start_date", "end_date", "prize_pool", "rating_type", "championship_id", "created_at", "updated_at" FROM `cups`;--> statement-breakpoint
DROP TABLE `cups`;--> statement-breakpoint
ALTER TABLE `__new_cups` RENAME TO `cups`;--> statement-breakpoint
CREATE UNIQUE INDEX `cups_name_unique` ON `cups` (`name`);--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text,
	`nickname` text,
	`blitz` integer DEFAULT 1900 NOT NULL,
	`rapid` integer DEFAULT 1900 NOT NULL,
	`classic` integer DEFAULT 1900 NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`description` text,
	`image_url` text,
	`cbx_id` integer,
	`fide_id` integer,
	`verified` integer DEFAULT false NOT NULL,
	`birth_date` text,
	`sex` text DEFAULT 'male' NOT NULL,
	`club_id` integer,
	`location_id` integer,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "players_rating_non_negative_check" CHECK("__new_players"."blitz" >= 0 AND "__new_players"."rapid" >= 0 AND "__new_players"."classic" >= 0),
	CONSTRAINT "players_sex_check" CHECK("__new_players"."sex" IN ('male', 'female'))
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "name", "normalized_name", "nickname", "blitz", "rapid", "classic", "active", "created_at", "updated_at", "description", "image_url", "cbx_id", "fide_id", "verified", "birth_date", "sex", "club_id", "location_id") SELECT "id", "name", "normalized_name", "nickname", "blitz", "rapid", "classic", "active", "created_at", "updated_at", "description", "image_url", "cbx_id", "fide_id", "verified", "birth_date", "sex", "club_id", "location_id" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
CREATE UNIQUE INDEX `players_nickname_unique` ON `players` (`nickname`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_cbx_id_unique` ON `players` (`cbx_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_fide_id_unique` ON `players` (`fide_id`);--> statement-breakpoint
CREATE INDEX `players_active_idx` ON `players` (`active`);--> statement-breakpoint
CREATE INDEX `players_sex_idx` ON `players` (`sex`);--> statement-breakpoint
CREATE INDEX `players_club_idx` ON `players` (`club_id`);--> statement-breakpoint
CREATE INDEX `players_location_idx` ON `players` (`location_id`);--> statement-breakpoint
CREATE INDEX `players_active_birth_date_idx` ON `players` (`active`,`birth_date`);--> statement-breakpoint
CREATE INDEX `players_classic_idx` ON `players` (`classic`);--> statement-breakpoint
CREATE INDEX `players_rapid_idx` ON `players` (`rapid`);--> statement-breakpoint
CREATE INDEX `players_blitz_idx` ON `players` (`blitz`);--> statement-breakpoint
CREATE INDEX `players_active_classic_idx` ON `players` (`active`,`classic`);--> statement-breakpoint
CREATE INDEX `players_active_rapid_idx` ON `players` (`active`,`rapid`);--> statement-breakpoint
CREATE INDEX `players_active_blitz_idx` ON `players` (`active`,`blitz`);--> statement-breakpoint
CREATE INDEX `players_name_idx` ON `players` (`name`);--> statement-breakpoint
CREATE TABLE `__new_players_to_tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`old_rating` integer NOT NULL,
	`variation` integer NOT NULL,
	`rating_type` text DEFAULT 'rapid' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "players_to_tournaments_old_rating_check" CHECK("__new_players_to_tournaments"."old_rating" >= 0),
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tournament_podiums_place_check" CHECK("__new_tournament_podiums"."place" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_tournament_podiums`("id", "player_id", "tournament_id", "place", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "place", "created_at", "updated_at" FROM `tournament_podiums`;--> statement-breakpoint
DROP TABLE `tournament_podiums`;--> statement-breakpoint
ALTER TABLE `__new_tournament_podiums` RENAME TO `tournament_podiums`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);