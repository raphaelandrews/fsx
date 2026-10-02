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
	CONSTRAINT "circuit_podiums_place_check" CHECK("__new_circuit_podiums"."place" IS NULL OR "__new_circuit_podiums"."place" BETWEEN 1 AND 25),
	CONSTRAINT "circuit_podiums_category_check" CHECK("__new_circuit_podiums"."category" IS NULL OR "__new_circuit_podiums"."category" IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
);
--> statement-breakpoint
INSERT INTO `__new_circuit_podiums`("id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at") SELECT "id", "player_id", "circuit_id", "circuit_phase_id", "category", "place", "points", "created_at", "updated_at" FROM `circuit_podiums`;--> statement-breakpoint
DROP TABLE `circuit_podiums`;--> statement-breakpoint
ALTER TABLE `__new_circuit_podiums` RENAME TO `circuit_podiums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_phase_idx` ON `circuit_podiums` (`circuit_phase_id`);--> statement-breakpoint
CREATE INDEX `circuit_podiums_circuit_idx` ON `circuit_podiums` (`circuit_id`);--> statement-breakpoint
CREATE TABLE `__new_cup_playoffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cup_bracket_id` integer NOT NULL,
	`phase_type` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`cup_bracket_id`) REFERENCES `cup_brackets`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cup_playoffs_phase_type_check" CHECK("__new_cup_playoffs"."phase_type" IN ('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior'))
);
--> statement-breakpoint
INSERT INTO `__new_cup_playoffs`("id", "cup_bracket_id", "phase_type", "sort_order", "created_at", "updated_at") SELECT "id", "cup_bracket_id", "phase_type", "sort_order", "created_at", "updated_at" FROM `cup_playoffs`;--> statement-breakpoint
DROP TABLE `cup_playoffs`;--> statement-breakpoint
ALTER TABLE `__new_cup_playoffs` RENAME TO `cup_playoffs`;--> statement-breakpoint
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
	FOREIGN KEY (`link_group_id`) REFERENCES `link_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "links_type_check" CHECK("__new_links"."type" IN ('link', 'regulation', 'form', 'results'))
);
--> statement-breakpoint
INSERT INTO `__new_links`("id", "href", "label", "icon", "type", "sort_order", "link_group_id", "created_at", "updated_at") SELECT "id", "href", "label", "icon", "type", "sort_order", "link_group_id", "created_at", "updated_at" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;--> statement-breakpoint
CREATE INDEX `links_link_group_id_idx` ON `links` (`link_group_id`);--> statement-breakpoint
CREATE TABLE `__new_titles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "titles_type_check" CHECK("__new_titles"."type" IN ('internal', 'external'))
);
--> statement-breakpoint
INSERT INTO `__new_titles`("id", "name", "short_name", "type", "created_at", "updated_at") SELECT "id", "name", "short_name", "type", "created_at", "updated_at" FROM `titles`;--> statement-breakpoint
DROP TABLE `titles`;--> statement-breakpoint
ALTER TABLE `__new_titles` RENAME TO `titles`;--> statement-breakpoint
CREATE UNIQUE INDEX `titles_name_unique` ON `titles` (`name`);