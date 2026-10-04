-- How much of the gamification plan (GAMIFICATION.md) the existing data can
-- support retroactively. Achievements are derived from history, so these counts
-- size the gaps: undated tournaments, broken rating chains, chains that start
-- mid-career, and podiums without a matching rating result. Read-only.
-- Rating chains are rows of one player and rating type in id order.
WITH checks(check_name, value) AS (
  VALUES
  ('players.total', (SELECT COUNT(*) FROM players)),
  ('players.active', (SELECT COUNT(*) FROM players WHERE active = 1)),
  ('players.with_history', (SELECT COUNT(DISTINCT player_id) FROM players_to_tournaments)),
  ('players.active_without_history', (SELECT COUNT(*) FROM players p WHERE p.active = 1
    AND NOT EXISTS (SELECT 1 FROM players_to_tournaments h WHERE h.player_id = p.id))),
  ('players.without_birth_date', (SELECT COUNT(*) FROM players WHERE birth_date IS NULL OR birth_date = '')),
  ('tournaments.total', (SELECT COUNT(*) FROM tournaments)),
  ('tournaments.without_date', (SELECT COUNT(*) FROM tournaments WHERE date IS NULL OR date = '')),
  ('tournaments.bad_date_format', (SELECT COUNT(*) FROM tournaments
    WHERE date IS NOT NULL AND date <> '' AND date NOT GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]')),
  ('tournaments.without_championship', (SELECT COUNT(*) FROM tournaments WHERE championship_id IS NULL)),
  ('tournaments.without_results', (SELECT COUNT(*) FROM tournaments t
    WHERE NOT EXISTS (SELECT 1 FROM players_to_tournaments h WHERE h.tournament_id = t.id))),
  ('history.rows', (SELECT COUNT(*) FROM players_to_tournaments)),
  ('history.rows_on_undated_tournaments', (SELECT COUNT(*) FROM players_to_tournaments h
    JOIN tournaments t ON t.id = h.tournament_id WHERE t.date IS NULL OR t.date = '')),
  ('history.duplicate_results', (SELECT COALESCE(SUM(n - 1), 0) FROM (SELECT COUNT(*) AS n FROM players_to_tournaments
    GROUP BY player_id, tournament_id, rating_type HAVING COUNT(*) > 1))),
  ('history.abs_variation_over_300', (SELECT COUNT(*) FROM players_to_tournaments WHERE ABS(variation) > 300)),
  ('chains.total', (SELECT COUNT(*) FROM (SELECT 1 FROM players_to_tournaments GROUP BY player_id, rating_type))),
  ('chains.start_at_default_1900', (SELECT COUNT(*) FROM (SELECT old_rating,
    ROW_NUMBER() OVER (PARTITION BY player_id, rating_type ORDER BY id) AS rn FROM players_to_tournaments) WHERE rn = 1 AND old_rating = 1900)),
  ('chains.start_at_or_above_2000', (SELECT COUNT(*) FROM (SELECT old_rating,
    ROW_NUMBER() OVER (PARTITION BY player_id, rating_type ORDER BY id) AS rn FROM players_to_tournaments) WHERE rn = 1 AND old_rating >= 2000)),
  ('chains.gaps', (SELECT COUNT(*) FROM (SELECT old_rating,
    LAG(old_rating + variation) OVER (PARTITION BY player_id, rating_type ORDER BY id) AS expected FROM players_to_tournaments)
    WHERE expected IS NOT NULL AND old_rating <> expected)),
  ('chains.current_rating_differs', (SELECT COUNT(*) FROM (SELECT h.old_rating + h.variation AS chain_end,
    CASE h.rating_type WHEN 'blitz' THEN p.blitz WHEN 'rapid' THEN p.rapid ELSE p.classic END AS current_rating,
    ROW_NUMBER() OVER (PARTITION BY h.player_id, h.rating_type ORDER BY h.id DESC) AS from_last
    FROM players_to_tournaments h JOIN players p ON p.id = h.player_id) WHERE from_last = 1 AND chain_end <> current_rating)),
  ('chains.date_order_inversions', (SELECT COUNT(*) FROM (SELECT t.date,
    LAG(t.date) OVER (PARTITION BY h.player_id, h.rating_type ORDER BY h.id) AS previous_date
    FROM players_to_tournaments h JOIN tournaments t ON t.id = h.tournament_id)
    WHERE date <> '' AND previous_date <> '' AND date < previous_date)),
  ('podiums.total', (SELECT COUNT(*) FROM tournament_podiums)),
  ('podiums.on_undated_tournaments', (SELECT COUNT(*) FROM tournament_podiums tp
    JOIN tournaments t ON t.id = tp.tournament_id WHERE t.date IS NULL OR t.date = '')),
  ('podiums.without_rating_result', (SELECT COUNT(*) FROM tournament_podiums tp WHERE NOT EXISTS (
    SELECT 1 FROM players_to_tournaments h WHERE h.player_id = tp.player_id AND h.tournament_id = tp.tournament_id))),
  ('podiums.duplicate_place', (SELECT COALESCE(SUM(n - 1), 0) FROM (SELECT COUNT(*) AS n FROM tournament_podiums
    GROUP BY tournament_id, place HAVING COUNT(*) > 1))),
  ('podiums.player_placed_twice', (SELECT COALESCE(SUM(n - 1), 0) FROM (SELECT COUNT(*) AS n FROM tournament_podiums
    GROUP BY tournament_id, player_id HAVING COUNT(*) > 1))),
  ('circuit_podiums.total', (SELECT COUNT(*) FROM circuit_podiums)),
  ('circuit_podiums.without_place', (SELECT COUNT(*) FROM circuit_podiums WHERE place IS NULL)),
  ('titles.internal', (SELECT COUNT(*) FROM titles WHERE type = 'internal')),
  ('titles.external', (SELECT COUNT(*) FROM titles WHERE type = 'external')),
  ('players_to_titles.total', (SELECT COUNT(*) FROM players_to_titles)),
  ('norms.total', (SELECT COUNT(*) FROM norms)),
  ('players_to_norms.total', (SELECT COUNT(*) FROM players_to_norms))
)
SELECT check_name, value FROM checks;

SELECT MIN(date) AS first_tournament_date, MAX(date) AS last_tournament_date
FROM tournaments WHERE date GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]';

SELECT 'norm' AS kind, n.id AS id, n.name AS name, NULL AS type, COUNT(pn.id) AS players FROM norms n
LEFT JOIN players_to_norms pn ON pn.norm_id = n.id GROUP BY n.id
UNION ALL
SELECT 'title', t.id, t.name, t.type, COUNT(pt.id) FROM titles t
LEFT JOIN players_to_titles pt ON pt.title_id = t.id GROUP BY t.id
ORDER BY kind, id;

SELECT rating_type, (peak / 100) * 100 AS peak_bucket, COUNT(*) AS chains FROM (
  SELECT rating_type, MAX(MAX(old_rating, old_rating + variation)) AS peak
  FROM players_to_tournaments GROUP BY player_id, rating_type
) GROUP BY rating_type, peak_bucket ORDER BY rating_type, peak_bucket;

SELECT MAX(n) AS max_results_per_player, AVG(n) AS avg_results_per_player FROM (
  SELECT COUNT(*) AS n FROM players_to_tournaments GROUP BY player_id
);

SELECT CASE WHEN circuit_id IS NOT NULL THEN 'circuit standings' ELSE 'circuit phase' END AS level,
  COUNT(*) AS podiums, SUM(place <= 3) AS top_three
FROM circuit_podiums GROUP BY level;

SELECT tp.tournament_id, t.name, tp.place, COUNT(*) AS players
FROM tournament_podiums tp JOIN tournaments t ON t.id = tp.tournament_id
GROUP BY tp.tournament_id, tp.place HAVING COUNT(*) > 1 ORDER BY tp.tournament_id, tp.place;
