ALTER TABLE `link_groups` ADD `event_id` integer REFERENCES events(id);--> statement-breakpoint
INSERT INTO `link_groups` (label, event_id)
SELECT 'Links', id FROM events WHERE regulation IS NOT NULL OR form IS NOT NULL OR chess_results IS NOT NULL;--> statement-breakpoint
INSERT INTO `links` (href, label, icon, sort_order, link_group_id)
SELECT e.regulation, 'Regulamento', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', 1, lg.id
FROM events e JOIN link_groups lg ON lg.event_id = e.id WHERE e.regulation IS NOT NULL;--> statement-breakpoint
INSERT INTO `links` (href, label, icon, sort_order, link_group_id)
SELECT e.form, 'Formulário', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', 2, lg.id
FROM events e JOIN link_groups lg ON lg.event_id = e.id WHERE e.form IS NOT NULL;--> statement-breakpoint
INSERT INTO `links` (href, label, icon, sort_order, link_group_id)
SELECT e.chess_results, 'Resultados', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', 3, lg.id
FROM events e JOIN link_groups lg ON lg.event_id = e.id WHERE e.chess_results IS NOT NULL;--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `chess_results`;--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `regulation`;--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `form`;
