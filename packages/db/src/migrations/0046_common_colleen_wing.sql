PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tv_sergipe` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer,
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
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "tv_sergipe_team_name_check" CHECK("team_name" IS NULL OR "team_name" IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J')),
	CONSTRAINT "tv_sergipe_age_group_check" CHECK("__new_tv_sergipe"."age_group" IN ('8', '10', '12', '14', '16', '18')),
	CONSTRAINT "tv_sergipe_sex_check" CHECK("__new_tv_sergipe"."sex" IN ('male', 'female')),
	CONSTRAINT "tv_sergipe_modality_check" CHECK("__new_tv_sergipe"."modality" IN ('individual', 'team')),
	CONSTRAINT "tv_sergipe_place_points_check" CHECK("__new_tv_sergipe"."place" BETWEEN 1 AND 8 AND "__new_tv_sergipe"."points" BETWEEN 0 AND 1000),
	CONSTRAINT "tv_sergipe_participant_check" CHECK(("__new_tv_sergipe"."modality" = 'individual' AND "__new_tv_sergipe"."player_id" IS NOT NULL AND "__new_tv_sergipe"."team_name" IS NULL) OR ("__new_tv_sergipe"."modality" = 'team' AND "__new_tv_sergipe"."player_id" IS NULL AND "__new_tv_sergipe"."team_name" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_tv_sergipe`("id", "tournament_id", "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at") SELECT "id", NULL, "club_id", "player_id", "team_name", "age_group", "sex", "modality", "place", "points", "created_at", "updated_at" FROM `tv_sergipe`;--> statement-breakpoint
DROP TABLE `tv_sergipe`;--> statement-breakpoint
ALTER TABLE `__new_tv_sergipe` RENAME TO `tv_sergipe`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tv_sergipe_age_sex_modality_idx` ON `tv_sergipe` (`age_group`,`sex`,`modality`);--> statement-breakpoint
CREATE INDEX `tv_sergipe_club_age_idx` ON `tv_sergipe` (`club_id`,`age_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_individual_unique_idx` ON `tv_sergipe` (`tournament_id`,`player_id`,`age_group`,`sex`);--> statement-breakpoint
CREATE UNIQUE INDEX `tv_sergipe_team_unique_idx` ON `tv_sergipe` (`tournament_id`,`club_id`,`age_group`,`sex`,`team_name`);--> statement-breakpoint
CREATE INDEX `tv_sergipe_tournament_idx` ON `tv_sergipe` (`tournament_id`);--> statement-breakpoint
ALTER TABLE `tournament_podiums` ADD `tv_sergipe_id` integer REFERENCES tv_sergipe(id) ON DELETE cascade;--> statement-breakpoint
CREATE INDEX `tournament_podiums_tv_sergipe_idx` ON `tournament_podiums` (`tv_sergipe_id`);