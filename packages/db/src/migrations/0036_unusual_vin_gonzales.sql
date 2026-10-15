CREATE INDEX `players_active_sex_ratings_idx` ON `players` (`active`,`sex`,`classic`,`rapid`,`blitz`);--> statement-breakpoint
CREATE INDEX `players_search_idx` ON `players` (`normalized_name`,`active`,`name`,`rapid`);--> statement-breakpoint
CREATE INDEX `tournaments_date_idx` ON `tournaments` (`date`);