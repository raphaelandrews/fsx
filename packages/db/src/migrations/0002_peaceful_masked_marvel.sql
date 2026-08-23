CREATE TABLE `school_results` (
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
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `school_results_age_sex_modality_idx` ON `school_results` (`age_group`,`sex`,`modality`);--> statement-breakpoint
CREATE INDEX `school_results_club_age_idx` ON `school_results` (`club_id`,`age_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `school_results_individual_unique_idx` ON `school_results` (`player_id`,`age_group`,`sex`);--> statement-breakpoint
CREATE UNIQUE INDEX `school_results_team_unique_idx` ON `school_results` (`club_id`,`age_group`,`sex`,`team_name`);