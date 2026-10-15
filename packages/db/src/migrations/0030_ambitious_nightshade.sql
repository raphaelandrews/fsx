ALTER TABLE `titles` ADD `tier` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE `titles` SET `tier` = 4 WHERE `name` IN ('Grande Mestre Sergipano', 'Grande Mestre Sergipana', 'Mestre Nacional', 'Mestre Internacional Feminina');--> statement-breakpoint
UPDATE `titles` SET `tier` = 3 WHERE `name` IN ('Mestre Sergipano', 'Mestre Sergipana', 'Mestre Sergipano Honoris Causa', 'Mestre Sergipana Honoris Causa');--> statement-breakpoint
UPDATE `titles` SET `tier` = 2 WHERE `name` IN ('Mestre Feminina Sergipana', 'Candidato a Mestre Sergipano', 'Candidata a Mestre Sergipana', 'Candidato a Mestre');
