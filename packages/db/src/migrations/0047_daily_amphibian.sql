-- Categories become data and circuit_podiums is renamed circuit_results. D1 runs a migration as one
-- transaction with foreign keys enforced, so the referenced circuit table is rebuilt the 0021 way:
-- children (tournament_podiums) are backed up and dropped first, then parents are recreated and
-- refilled. Rows keep their ids; tournament_podiums.circuit_podium_id becomes circuit_result_id.
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`sex` text,
	`age_limit` integer,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "categories_kind_check" CHECK("categories"."kind" IN ('age', 'open')),
	CONSTRAINT "categories_shape_check" CHECK(("categories"."kind" = 'open' AND "categories"."sex" IS NULL AND "categories"."age_limit" IS NULL) OR ("categories"."kind" = 'age' AND "categories"."sex" IN ('male', 'female') AND "categories"."age_limit" BETWEEN 1 AND 100))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);
--> statement-breakpoint
INSERT INTO `categories` (`name`, `kind`, `sex`, `age_limit`, `sort_order`) VALUES
	('Sub 8 Masculino', 'age', 'male', 8, 1),
	('Sub 10 Masculino', 'age', 'male', 10, 2),
	('Sub 12 Masculino', 'age', 'male', 12, 3),
	('Sub 14 Masculino', 'age', 'male', 14, 4),
	('Sub 16 Masculino', 'age', 'male', 16, 5),
	('Sub 18 Masculino', 'age', 'male', 18, 6),
	('Sub 8 Feminino', 'age', 'female', 8, 7),
	('Sub 10 Feminino', 'age', 'female', 10, 8),
	('Sub 12 Feminino', 'age', 'female', 12, 9),
	('Sub 14 Feminino', 'age', 'female', 14, 10),
	('Sub 16 Feminino', 'age', 'female', 16, 11),
	('Sub 18 Feminino', 'age', 'female', 18, 12),
	('Futuro', 'open', NULL, NULL, 13),
	('Juvenil', 'open', NULL, NULL, 14),
	('Master', 'open', NULL, NULL, 15);
--> statement-breakpoint
CREATE TABLE `scoring_schemes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scoring_schemes_name_unique` ON `scoring_schemes` (`name`);
--> statement-breakpoint
CREATE TABLE `scoring_scheme_places` (
	`scheme_id` integer NOT NULL,
	`place` integer NOT NULL,
	`points` integer NOT NULL,
	PRIMARY KEY(`scheme_id`, `place`),
	FOREIGN KEY (`scheme_id`) REFERENCES `scoring_schemes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "scoring_scheme_places_place_check" CHECK("scoring_scheme_places"."place" BETWEEN 1 AND 1000),
	CONSTRAINT "scoring_scheme_places_points_check" CHECK("scoring_scheme_places"."points" BETWEEN 0 AND 1000000)
);
--> statement-breakpoint
INSERT INTO `scoring_schemes` (`name`) VALUES ('Jogos Escolares (1º ao 8º)');
--> statement-breakpoint
INSERT INTO `scoring_scheme_places` (`scheme_id`, `place`, `points`) VALUES (1, 1, 10), (1, 2, 8), (1, 3, 6), (1, 4, 5), (1, 5, 4), (1, 6, 3), (1, 7, 2), (1, 8, 1);
--> statement-breakpoint
CREATE TABLE `__bak_tournament_podiums` AS SELECT * FROM `tournament_podiums`;
--> statement-breakpoint
DROP TABLE `tournament_podiums`;
--> statement-breakpoint
CREATE TABLE `circuit_results` (
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
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "circuit_results_target_check" CHECK(("circuit_results"."circuit_id" IS NULL) <> ("circuit_results"."circuit_phase_id" IS NULL)),
	CONSTRAINT "circuit_results_points_check" CHECK("circuit_results"."points" BETWEEN 0 AND 1000000),
	CONSTRAINT "circuit_results_place_check" CHECK("circuit_results"."place" IS NULL OR "circuit_results"."place" BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE INDEX `circuit_results_circuit_phase_idx` ON `circuit_results` (`circuit_phase_id`);
--> statement-breakpoint
CREATE INDEX `circuit_results_circuit_idx` ON `circuit_results` (`circuit_id`);
--> statement-breakpoint
INSERT INTO `circuit_results` (`id`, `player_id`, `circuit_id`, `circuit_phase_id`, `category`, `place`, `points`, `created_at`, `updated_at`) SELECT `id`, `player_id`, `circuit_id`, `circuit_phase_id`, `category`, `place`, `points`, `created_at`, `updated_at` FROM `circuit_podiums`;
--> statement-breakpoint
DROP TABLE `circuit_podiums`;
--> statement-breakpoint
CREATE TABLE `tournament_podiums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`tournament_id` integer NOT NULL,
	`place` integer NOT NULL,
	`category` text,
	`circuit_result_id` integer,
	`tv_sergipe_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`circuit_result_id`) REFERENCES `circuit_results`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tv_sergipe_id`) REFERENCES `tv_sergipe`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tournament_podiums_place_check" CHECK("tournament_podiums"."place" BETWEEN 1 AND 100000)
);
--> statement-breakpoint
INSERT INTO `tournament_podiums` (`id`, `player_id`, `tournament_id`, `place`, `category`, `circuit_result_id`, `tv_sergipe_id`, `created_at`, `updated_at`) SELECT `id`, `player_id`, `tournament_id`, `place`, `category`, `circuit_podium_id`, `tv_sergipe_id`, `created_at`, `updated_at` FROM `__bak_tournament_podiums`;
--> statement-breakpoint
DROP TABLE `__bak_tournament_podiums`;
--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_podium` ON `tournament_podiums` (`player_id`,`tournament_id`) WHERE "tournament_podiums"."category" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `player_tournament_category_podium` ON `tournament_podiums` (`player_id`,`tournament_id`,`category`) WHERE "tournament_podiums"."category" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `tournament_podiums_circuit_result_idx` ON `tournament_podiums` (`circuit_result_id`);
--> statement-breakpoint
CREATE INDEX `tournament_podiums_tv_sergipe_idx` ON `tournament_podiums` (`tv_sergipe_id`);
--> statement-breakpoint
CREATE INDEX `tournament_podiums_tournament_place_idx` ON `tournament_podiums` (`tournament_id`,`place`);
--> statement-breakpoint
CREATE TABLE `__bak_circuit_final_podiums` AS SELECT * FROM `circuit_final_podiums`;
--> statement-breakpoint
DROP TABLE `circuit_final_podiums`;
--> statement-breakpoint
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
	FOREIGN KEY (`category`) REFERENCES `categories`(`name`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "circuit_final_podiums_place_check" CHECK("circuit_final_podiums"."place" BETWEEN 1 AND 1000),
	CONSTRAINT "circuit_final_podiums_points_check" CHECK("circuit_final_podiums"."points" IS NULL OR "circuit_final_podiums"."points" BETWEEN 0 AND 1000000)
);
--> statement-breakpoint
INSERT INTO `circuit_final_podiums` (`id`, `circuit_id`, `player_id`, `category`, `place`, `points`, `created_at`, `updated_at`) SELECT `id`, `circuit_id`, `player_id`, `category`, `place`, `points`, `created_at`, `updated_at` FROM `__bak_circuit_final_podiums`;
--> statement-breakpoint
DROP TABLE `__bak_circuit_final_podiums`;
--> statement-breakpoint
CREATE UNIQUE INDEX `circuit_final_podium_player` ON `circuit_final_podiums` (`circuit_id`,`player_id`) WHERE "circuit_final_podiums"."category" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `circuit_final_podium_category_player` ON `circuit_final_podiums` (`circuit_id`,`category`,`player_id`) WHERE "circuit_final_podiums"."category" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `circuit_final_podiums_player_idx` ON `circuit_final_podiums` (`player_id`);
--> statement-breakpoint
ALTER TABLE `circuits` ADD `scoring_scheme_id` integer REFERENCES scoring_schemes(id) ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE `tournaments` ADD `scoring_scheme_id` integer REFERENCES scoring_schemes(id) ON DELETE restrict;
--> statement-breakpoint
UPDATE `circuits` SET `scoring_scheme_id` = (SELECT `id` FROM `scoring_schemes` LIMIT 1) WHERE `type` = 'school';
--> statement-breakpoint
UPDATE `tournaments` SET `scoring_scheme_id` = (SELECT `id` FROM `scoring_schemes` LIMIT 1) WHERE `id` IN (SELECT `tournament_id` FROM `tv_sergipe` WHERE `tournament_id` IS NOT NULL);
