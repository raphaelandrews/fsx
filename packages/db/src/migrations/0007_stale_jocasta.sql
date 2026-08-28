ALTER TABLE `school_results` RENAME TO `tv_sergipe`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tv_sergipe`("id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at") SELECT "id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at" FROM `tv_sergipe`;--> statement-breakpoint
DROP TABLE `tv_sergipe`;--> statement-breakpoint
ALTER TABLE `__new_tv_sergipe` RENAME TO `tv_sergipe`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tv_sergipe_age_sex_modality_idx` ON `tv_sergipe` (`age_group`,`sex`,`modality`);--> statement-breakpoint
CREATE INDEX `tv_sergipe_club_age_idx` ON `tv_sergipe` (`club_id`,`age_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_individual_unique_idx` ON `tv_sergipe` (`player_id`,`age_group`,`sex`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_team_unique_idx` ON `tv_sergipe` (`club_id`,`age_group`,`sex`,`team_name`);