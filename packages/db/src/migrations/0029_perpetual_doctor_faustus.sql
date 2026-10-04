CREATE TABLE `ranking_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`rating_type` text NOT NULL,
	`position` integer NOT NULL,
	`rating` integer NOT NULL,
	`snapshot_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ranking_snapshots_rating_type_check" CHECK("ranking_snapshots"."rating_type" IN ('blitz', 'rapid', 'classic')),
	CONSTRAINT "ranking_snapshots_position_check" CHECK("ranking_snapshots"."position" >= 1)
);
--> statement-breakpoint
CREATE INDEX `ranking_snapshots_player_type_at_idx` ON `ranking_snapshots` (`player_id`,`rating_type`,`snapshot_at`);