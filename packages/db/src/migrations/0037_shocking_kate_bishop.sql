CREATE TABLE `player_update_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`nickname` text,
	`birth_date` text,
	`club_id` integer,
	`location_id` integer,
	`cbx_id` integer,
	`fide_id` integer,
	`contact` text,
	`message` text,
	`review_note` text,
	`reviewed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "player_update_requests_status_check" CHECK("player_update_requests"."status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `player_update_requests_status_idx` ON `player_update_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `player_update_requests_player_idx` ON `player_update_requests` (`player_id`,`status`);