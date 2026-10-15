ALTER TABLE `players_to_tournaments` ADD `rating_type` text DEFAULT 'rapid' NOT NULL;
UPDATE `players_to_tournaments`
SET `rating_type` = (
  SELECT `rating_type`
  FROM `tournaments`
  WHERE `tournaments`.`id` = `players_to_tournaments`.`tournament_id`
)
WHERE EXISTS (
  SELECT 1
  FROM `tournaments`
  WHERE `tournaments`.`id` = `players_to_tournaments`.`tournament_id`
);
