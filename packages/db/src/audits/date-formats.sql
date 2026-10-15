-- Date columns the API now validates as YYYY-MM-DD. Rows listed here fail
-- validation when edited and are skipped or misplaced by age-group filters.
SELECT 'tournaments.date' AS field, id, date AS value FROM tournaments
WHERE date IS NOT NULL AND date NOT GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'
UNION ALL
SELECT 'events.start_date', id, start_date FROM events
WHERE start_date IS NOT NULL AND start_date NOT GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'
ORDER BY field, id;
