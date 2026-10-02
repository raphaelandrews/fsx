PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text,
	`nickname` text,
	`blitz` integer DEFAULT 1900 NOT NULL,
	`rapid` integer DEFAULT 1900 NOT NULL,
	`classic` integer DEFAULT 1900 NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
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
	CONSTRAINT "players_rating_range_check" CHECK("__new_players"."blitz" BETWEEN 0 AND 4000 AND "__new_players"."rapid" BETWEEN 0 AND 4000 AND "__new_players"."classic" BETWEEN 0 AND 4000),
	CONSTRAINT "players_sex_check" CHECK("__new_players"."sex" IN ('male', 'female'))
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "name", "normalized_name", "nickname", "blitz", "rapid", "classic", "active", "created_at", "updated_at", "description", "image_url", "cbx_id", "fide_id", "verified", "birth_date", "sex", "club_id", "location_id") SELECT "id", "name", "normalized_name", "nickname", "blitz", "rapid", "classic", "active", "created_at", "updated_at", "description", "image_url", "cbx_id", "fide_id", "verified", "birth_date", "sex", "club_id", "location_id" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
CREATE TABLE `__new_announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`number` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "announcements_year_check" CHECK("__new_announcements"."year" BETWEEN 1900 AND 2200),
	CONSTRAINT "announcements_number_check" CHECK("__new_announcements"."number" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_announcements`("id", "year", "number", "content", "created_at", "updated_at") SELECT "id", "year", "number", "content", "created_at", "updated_at" FROM `announcements`;--> statement-breakpoint
DROP TABLE `announcements`;--> statement-breakpoint
ALTER TABLE `__new_announcements` RENAME TO `announcements`;--> statement-breakpoint
CREATE UNIQUE INDEX `announcements_content_unique` ON `announcements` (`content`);--> statement-breakpoint
CREATE UNIQUE INDEX `year_number` ON `announcements` (`year`,`number`);--> statement-breakpoint
CREATE TABLE `__new_championships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_championships`("id", "name", "created_at", "updated_at") SELECT "id", "name", "created_at", "updated_at" FROM `championships`;--> statement-breakpoint
DROP TABLE `championships`;--> statement-breakpoint
ALTER TABLE `__new_championships` RENAME TO `championships`;--> statement-breakpoint
CREATE UNIQUE INDEX `championships_name_unique` ON `championships` (`name`);--> statement-breakpoint
CREATE TABLE `__new_circuit_phases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`circuit_id` integer NOT NULL,
	`club_id` integer,
	`tournament_id` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_circuit_phases`("id", "circuit_id", "club_id", "tournament_id", "sort_order", "created_at", "updated_at") SELECT "id", "circuit_id", "club_id", "tournament_id", "sort_order", "created_at", "updated_at" FROM `circuit_phases`;--> statement-breakpoint
DROP TABLE `circuit_phases`;--> statement-breakpoint
ALTER TABLE `__new_circuit_phases` RENAME TO `circuit_phases`;--> statement-breakpoint
CREATE INDEX `circuit_phases_circuit_sort_order_idx` ON `circuit_phases` (`circuit_id`,`sort_order`);--> statement-breakpoint
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
	CONSTRAINT "circuit_podiums_points_check" CHECK("__new_circuit_podiums"."points" >= 0),
	CONSTRAINT "circuit_podiums_place_check" CHECK("__new_circuit_podiums"."place" IS NULL OR "__new_circuit_podiums"."place" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_phase_idx` ON `circuit_podiums` (`circuit_phase_id`);--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_idx` ON `circuit_podiums` (`circuit_id`);--> statement-breakpoint
CREATE TABLE `__new_circuits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "circuits_type_check" CHECK("__new_circuits"."type" IN ('default', 'categories', 'school', 'geral'))
);
--> statement-breakpoint
INSERT INTO `__new_circuits`("id", "name", "type", "created_at", "updated_at") SELECT "id", "name", "type", "created_at", "updated_at" FROM `circuits`;--> statement-breakpoint
DROP TABLE `circuits`;--> statement-breakpoint
ALTER TABLE `__new_circuits` RENAME TO `circuits`;--> statement-breakpoint
CREATE UNIQUE INDEX `circuits_name_unique` ON `circuits` (`name`);--> statement-breakpoint
CREATE TABLE `__new_clubs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_clubs`("id", "name", "logo_url", "created_at", "updated_at") SELECT "id", "name", "logo_url", "created_at", "updated_at" FROM `clubs`;--> statement-breakpoint
DROP TABLE `clubs`;--> statement-breakpoint
ALTER TABLE `__new_clubs` RENAME TO `clubs`;--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_name_unique` ON `clubs` (`name`);--> statement-breakpoint
CREATE TABLE `__new_cup_brackets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cup_id` integer NOT NULL,
	`bracket_type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`cup_id`) REFERENCES `cups`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cup_brackets_type_check" CHECK("__new_cup_brackets"."bracket_type" IN ('UB', 'LB', 'GF'))
);
--> statement-breakpoint
INSERT INTO `__new_cup_brackets`("id", "cup_id", "bracket_type", "created_at", "updated_at") SELECT "id", "cup_id", "bracket_type", "created_at", "updated_at" FROM `cup_brackets`;--> statement-breakpoint
DROP TABLE `cup_brackets`;--> statement-breakpoint
ALTER TABLE `__new_cup_brackets` RENAME TO `cup_brackets`;--> statement-breakpoint
CREATE TABLE `__new_cup_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winner_id` integer,
	`cup_match_id` integer NOT NULL,
	`game_number` integer NOT NULL,
	`link` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`winner_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cup_match_id`) REFERENCES `cup_matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_games`("id", "winner_id", "cup_match_id", "game_number", "link", "created_at", "updated_at") SELECT "id", "winner_id", "cup_match_id", "game_number", "link", "created_at", "updated_at" FROM `cup_games`;--> statement-breakpoint
DROP TABLE `cup_games`;--> statement-breakpoint
ALTER TABLE `__new_cup_games` RENAME TO `cup_games`;--> statement-breakpoint
CREATE INDEX `cup_games_match_game_idx` ON `cup_games` (`cup_match_id`,`game_number`);--> statement-breakpoint
CREATE TABLE `__new_cup_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cup_id` integer NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`cup_id`) REFERENCES `cups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_groups`("id", "cup_id", "name", "sort_order", "created_at", "updated_at") SELECT "id", "cup_id", "name", "sort_order", "created_at", "updated_at" FROM `cup_groups`;--> statement-breakpoint
DROP TABLE `cup_groups`;--> statement-breakpoint
ALTER TABLE `__new_cup_groups` RENAME TO `cup_groups`;--> statement-breakpoint
CREATE TABLE `__new_cup_matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_one_id` integer NOT NULL,
	`player_two_id` integer NOT NULL,
	`winner_id` integer,
	`cup_round_id` integer,
	`cup_playoff_id` integer,
	`best_of` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_one_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_two_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cup_round_id`) REFERENCES `cup_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cup_playoff_id`) REFERENCES `cup_playoffs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_matches`("id", "player_one_id", "player_two_id", "winner_id", "cup_round_id", "cup_playoff_id", "best_of", "sort_order", "date", "created_at", "updated_at") SELECT "id", "player_one_id", "player_two_id", "winner_id", "cup_round_id", "cup_playoff_id", "best_of", "sort_order", "date", "created_at", "updated_at" FROM `cup_matches`;--> statement-breakpoint
DROP TABLE `cup_matches`;--> statement-breakpoint
ALTER TABLE `__new_cup_matches` RENAME TO `cup_matches`;--> statement-breakpoint
CREATE TABLE `__new_cup_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`cup_group_id` integer NOT NULL,
	`nickname` text,
	`position` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`cup_group_id`) REFERENCES `cup_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_players`("id", "player_id", "cup_group_id", "nickname", "position", "created_at", "updated_at") SELECT "id", "player_id", "cup_group_id", "nickname", "position", "created_at", "updated_at" FROM `cup_players`;--> statement-breakpoint
DROP TABLE `cup_players`;--> statement-breakpoint
ALTER TABLE `__new_cup_players` RENAME TO `cup_players`;--> statement-breakpoint
CREATE TABLE `__new_cup_playoffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cup_bracket_id` integer NOT NULL,
	`phase_type` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`cup_bracket_id`) REFERENCES `cup_brackets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_playoffs`("id", "cup_bracket_id", "phase_type", "sort_order", "created_at", "updated_at") SELECT "id", "cup_bracket_id", "phase_type", "sort_order", "created_at", "updated_at" FROM `cup_playoffs`;--> statement-breakpoint
DROP TABLE `cup_playoffs`;--> statement-breakpoint
ALTER TABLE `__new_cup_playoffs` RENAME TO `cup_playoffs`;--> statement-breakpoint
CREATE TABLE `__new_cup_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cup_group_id` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`cup_group_id`) REFERENCES `cup_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cup_rounds`("id", "cup_group_id", "sort_order", "created_at", "updated_at") SELECT "id", "cup_group_id", "sort_order", "created_at", "updated_at" FROM `cup_rounds`;--> statement-breakpoint
DROP TABLE `cup_rounds`;--> statement-breakpoint
ALTER TABLE `__new_cup_rounds` RENAME TO `cup_rounds`;--> statement-breakpoint
CREATE TABLE `__new_cups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`prize_pool` integer NOT NULL,
	`rating_type` text NOT NULL,
	`championship_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cups_prize_pool_non_negative_check" CHECK("__new_cups"."prize_pool" >= 0),
	CONSTRAINT "cups_rating_type_check" CHECK("__new_cups"."rating_type" IN ('blitz', 'rapid', 'classic'))
);
--> statement-breakpoint
INSERT INTO `__new_cups`("id", "name", "image_url", "start_date", "end_date", "prize_pool", "rating_type", "championship_id", "created_at", "updated_at") SELECT "id", "name", "image_url", "start_date", "end_date", "prize_pool", "rating_type", "championship_id", "created_at", "updated_at" FROM `cups`;--> statement-breakpoint
DROP TABLE `cups`;--> statement-breakpoint
ALTER TABLE `__new_cups` RENAME TO `cups`;--> statement-breakpoint
CREATE UNIQUE INDEX `cups_name_unique` ON `cups` (`name`);--> statement-breakpoint
CREATE TABLE `__new_defending_champions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`championship_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_defending_champions`("id", "player_id", "championship_id", "created_at", "updated_at") SELECT "id", "player_id", "championship_id", "created_at", "updated_at" FROM `defending_champions`;--> statement-breakpoint
DROP TABLE `defending_champions`;--> statement-breakpoint
ALTER TABLE `__new_defending_champions` RENAME TO `defending_champions`;--> statement-breakpoint
CREATE UNIQUE INDEX `defending_champion` ON `defending_champions` (`player_id`,`championship_id`);--> statement-breakpoint
CREATE TABLE `__new_insignias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_insignias`("id", "name", "level", "created_at", "updated_at") SELECT "id", "name", "level", "created_at", "updated_at" FROM `insignias`;--> statement-breakpoint
DROP TABLE `insignias`;--> statement-breakpoint
ALTER TABLE `__new_insignias` RENAME TO `insignias`;--> statement-breakpoint
CREATE UNIQUE INDEX `insignias_name_unique` ON `insignias` (`name`);--> statement-breakpoint
CREATE TABLE `__new_link_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`event_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_link_groups`("id", "label", "event_id", "created_at", "updated_at") SELECT "id", "label", "event_id", "created_at", "updated_at" FROM `link_groups`;--> statement-breakpoint
DROP TABLE `link_groups`;--> statement-breakpoint
ALTER TABLE `__new_link_groups` RENAME TO `link_groups`;--> statement-breakpoint
CREATE UNIQUE INDEX `link_groups_event_id_unique` ON `link_groups` (`event_id`);--> statement-breakpoint
CREATE TABLE `__new_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`href` text,
	`label` text NOT NULL,
	`icon` text NOT NULL,
	`type` text DEFAULT 'link' NOT NULL,
	`sort_order` integer NOT NULL,
	`link_group_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`link_group_id`) REFERENCES `link_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_links`("id", "href", "label", "icon", "type", "sort_order", "link_group_id", "created_at", "updated_at") SELECT "id", "href", "label", "icon", "type", "sort_order", "link_group_id", "created_at", "updated_at" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;--> statement-breakpoint
CREATE INDEX `links_link_group_id_idx` ON `links` (`link_group_id`);--> statement-breakpoint
CREATE TABLE `__new_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`flag_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "locations_type_check" CHECK("__new_locations"."type" IN ('city', 'state', 'country'))
);
--> statement-breakpoint
INSERT INTO `__new_locations`("id", "name", "type", "flag_url", "created_at", "updated_at") SELECT "id", "name", "type", "flag_url", "created_at", "updated_at" FROM `locations`;--> statement-breakpoint
DROP TABLE `locations`;--> statement-breakpoint
ALTER TABLE `__new_locations` RENAME TO `locations`;--> statement-breakpoint
CREATE UNIQUE INDEX `locations_name_unique` ON `locations` (`name`);--> statement-breakpoint
CREATE TABLE `__new_norms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_norms`("id", "name", "created_at", "updated_at") SELECT "id", "name", "created_at", "updated_at" FROM `norms`;--> statement-breakpoint
DROP TABLE `norms`;--> statement-breakpoint
ALTER TABLE `__new_norms` RENAME TO `norms`;--> statement-breakpoint
CREATE UNIQUE INDEX `norms_name_unique` ON `norms` (`name`);--> statement-breakpoint
CREATE TABLE `__new_players_to_insignias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`insignia_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`insignia_id`) REFERENCES `insignias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_to_insignias`("id", "player_id", "insignia_id", "created_at", "updated_at") SELECT "id", "player_id", "insignia_id", "created_at", "updated_at" FROM `players_to_insignias`;--> statement-breakpoint
DROP TABLE `players_to_insignias`;--> statement-breakpoint
ALTER TABLE `__new_players_to_insignias` RENAME TO `players_to_insignias`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_insignia` ON `players_to_insignias` (`player_id`,`insignia_id`);--> statement-breakpoint
CREATE TABLE `__new_players_to_norms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`norm_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`norm_id`) REFERENCES `norms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_to_norms`("id", "player_id", "norm_id", "created_at", "updated_at") SELECT "id", "player_id", "norm_id", "created_at", "updated_at" FROM `players_to_norms`;--> statement-breakpoint
DROP TABLE `players_to_norms`;--> statement-breakpoint
ALTER TABLE `__new_players_to_norms` RENAME TO `players_to_norms`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_norm` ON `players_to_norms` (`player_id`,`norm_id`);--> statement-breakpoint
CREATE TABLE `__new_players_to_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_to_roles`("id", "player_id", "role_id", "created_at", "updated_at") SELECT "id", "player_id", "role_id", "created_at", "updated_at" FROM `players_to_roles`;--> statement-breakpoint
DROP TABLE `players_to_roles`;--> statement-breakpoint
ALTER TABLE `__new_players_to_roles` RENAME TO `players_to_roles`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_role` ON `players_to_roles` (`player_id`,`role_id`);--> statement-breakpoint
CREATE TABLE `__new_players_to_titles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`title_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_to_titles`("id", "player_id", "title_id", "created_at", "updated_at") SELECT "id", "player_id", "title_id", "created_at", "updated_at" FROM `players_to_titles`;--> statement-breakpoint
DROP TABLE `players_to_titles`;--> statement-breakpoint
ALTER TABLE `__new_players_to_titles` RENAME TO `players_to_titles`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_title` ON `players_to_titles` (`player_id`,`title_id`);--> statement-breakpoint
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
	CONSTRAINT "players_to_tournaments_old_rating_check" CHECK("__new_players_to_tournaments"."old_rating" >= 0),
	CONSTRAINT "players_to_tournaments_rating_type_check" CHECK("__new_players_to_tournaments"."rating_type" IN ('blitz', 'rapid', 'classic'))
);
--> statement-breakpoint
INSERT INTO `__new_players_to_tournaments`("id", "player_id", "tournament_id", "old_rating", "variation", "rating_type", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "old_rating", "variation", "rating_type", "created_at", "updated_at" FROM `players_to_tournaments`;--> statement-breakpoint
DROP TABLE `players_to_tournaments`;--> statement-breakpoint
ALTER TABLE `__new_players_to_tournaments` RENAME TO `players_to_tournaments`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament` ON `players_to_tournaments` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE TABLE `__new_tv_sergipe` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`club_id` integer NOT NULL,
	`player_id` integer,
	`team_name` text,
	`age_group` text NOT NULL,
	`sex` text NOT NULL,
	`modality` text NOT NULL,
	`place` integer NOT NULL,
	`points` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tv_sergipe_team_name_check" CHECK("team_name" IS NULL OR "team_name" IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J')),
	CONSTRAINT "tv_sergipe_age_group_check" CHECK("__new_tv_sergipe"."age_group" IN ('8', '10', '12', '14', '16', '18')),
	CONSTRAINT "tv_sergipe_sex_check" CHECK("__new_tv_sergipe"."sex" IN ('male', 'female')),
	CONSTRAINT "tv_sergipe_modality_check" CHECK("__new_tv_sergipe"."modality" IN ('individual', 'team')),
	CONSTRAINT "tv_sergipe_place_points_check" CHECK("__new_tv_sergipe"."place" BETWEEN 1 AND 8 AND "__new_tv_sergipe"."points" BETWEEN 1 AND 10),
	CONSTRAINT "tv_sergipe_participant_check" CHECK(("__new_tv_sergipe"."modality" = 'individual' AND "__new_tv_sergipe"."player_id" IS NOT NULL AND "__new_tv_sergipe"."team_name" IS NULL) OR ("__new_tv_sergipe"."modality" = 'team' AND "__new_tv_sergipe"."player_id" IS NULL AND "__new_tv_sergipe"."team_name" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_tv_sergipe`("id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at") SELECT "id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at" FROM `tv_sergipe`;--> statement-breakpoint
DROP TABLE `tv_sergipe`;--> statement-breakpoint
ALTER TABLE `__new_tv_sergipe` RENAME TO `tv_sergipe`;--> statement-breakpoint
CREATE INDEX `tv_sergipe_age_sex_modality_idx` ON `tv_sergipe` (`age_group`,`sex`,`modality`);--> statement-breakpoint
CREATE INDEX `tv_sergipe_club_age_idx` ON `tv_sergipe` (`club_id`,`age_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_individual_unique_idx` ON `tv_sergipe` (`player_id`,`age_group`,`sex`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_team_unique_idx` ON `tv_sergipe` (`club_id`,`age_group`,`sex`,`team_name`);--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`image_url` text,
	`content` text NOT NULL,
	`slug` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "title", "image_url", "content", "slug", "published", "created_at", "updated_at") SELECT "id", "title", "image_url", "content", "slug", "published", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "roles_type_check" CHECK("__new_roles"."type" IN ('management', 'referee', 'teacher'))
);
--> statement-breakpoint
INSERT INTO `__new_roles`("id", "name", "short_name", "type", "created_at", "updated_at") SELECT "id", "name", "short_name", "type", "created_at", "updated_at" FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_short_name_unique` ON `roles` (`short_name`);--> statement-breakpoint
CREATE TABLE `__new_titles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_titles`("id", "name", "short_name", "type", "created_at", "updated_at") SELECT "id", "name", "short_name", "type", "created_at", "updated_at" FROM `titles`;--> statement-breakpoint
DROP TABLE `titles`;--> statement-breakpoint
ALTER TABLE `__new_titles` RENAME TO `titles`;--> statement-breakpoint
CREATE UNIQUE INDEX `titles_name_unique` ON `titles` (`name`);--> statement-breakpoint
CREATE TABLE `__new_tournament_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`place` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tournament_podiums_place_check" CHECK("__new_tournament_podiums"."place" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_tournament_podiums`("id", "player_id", "tournament_id", "place", "created_at", "updated_at") SELECT "id", "player_id", "tournament_id", "place", "created_at", "updated_at" FROM `tournament_podiums`;--> statement-breakpoint
DROP TABLE `tournament_podiums`;--> statement-breakpoint
ALTER TABLE `__new_tournament_podiums` RENAME TO `tournament_podiums`;--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`);--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);--> statement-breakpoint
CREATE TABLE `__new_tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`chess_results` text,
	`date` text,
	`rating_type` text NOT NULL,
	`championship_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "tournaments_rating_type_check" CHECK("__new_tournaments"."rating_type" IN ('blitz', 'rapid', 'classic'))
);
--> statement-breakpoint
INSERT INTO `__new_tournaments`("id", "name", "chess_results", "date", "rating_type", "championship_id", "created_at", "updated_at") SELECT "id", "name", "chess_results", "date", "rating_type", "championship_id", "created_at", "updated_at" FROM `tournaments`;--> statement-breakpoint
DROP TABLE `tournaments`;--> statement-breakpoint
ALTER TABLE `__new_tournaments` RENAME TO `tournaments`;--> statement-breakpoint
CREATE UNIQUE INDEX `tournaments_name_unique` ON `tournaments` (`name`);