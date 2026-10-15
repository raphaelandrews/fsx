ALTER TABLE `titles` ADD `loses_at_age` integer;--> statement-breakpoint
UPDATE `titles` SET `loses_at_age` = 15 WHERE `name` IN ('Mestre Mirim Sergipano', 'Mestre Mirim Sergipana');--> statement-breakpoint
UPDATE `titles` SET `loses_at_age` = 19 WHERE `name` IN ('Mestre Júnior Sergipano', 'Mestre Júnior Sergipana');
