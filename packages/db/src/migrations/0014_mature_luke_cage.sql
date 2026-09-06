CREATE INDEX `link_groups_event_id_idx` ON `link_groups` (`event_id`);--> statement-breakpoint
CREATE INDEX `links_link_group_id_idx` ON `links` (`link_group_id`);--> statement-breakpoint
CREATE INDEX `players_classic_idx` ON `players` (`classic`);--> statement-breakpoint
CREATE INDEX `players_rapid_idx` ON `players` (`rapid`);--> statement-breakpoint
CREATE INDEX `players_blitz_idx` ON `players` (`blitz`);