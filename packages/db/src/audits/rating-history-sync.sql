-- Rating history that no longer matches the players' ratings. Rows of one player
-- and rating type form a chain in id order: each old_rating must equal the
-- previous row's old_rating + variation, and the last result must equal the
-- current rating. Gaps come from tournaments deleted before deletes were blocked
-- or from ratings edited by hand. Read-only.
WITH chain AS (
  SELECT
    h.id, h.player_id, h.tournament_id, h.rating_type, h.old_rating, h.variation,
    LAG(h.old_rating + h.variation) OVER (PARTITION BY h.player_id, h.rating_type ORDER BY h.id) AS expected_old,
    ROW_NUMBER() OVER (PARTITION BY h.player_id, h.rating_type ORDER BY h.id DESC) AS from_last
  FROM players_to_tournaments h
)
SELECT 'gap before result' AS issue, c.player_id, p.name, c.rating_type, c.id AS result_id, c.tournament_id,
  c.expected_old AS expected, c.old_rating AS actual
FROM chain c JOIN players p ON p.id = c.player_id
WHERE c.expected_old IS NOT NULL AND c.old_rating <> c.expected_old
UNION ALL
SELECT 'current rating differs', c.player_id, p.name, c.rating_type, c.id, c.tournament_id,
  c.old_rating + c.variation,
  CASE c.rating_type WHEN 'blitz' THEN p.blitz WHEN 'rapid' THEN p.rapid ELSE p.classic END
FROM chain c JOIN players p ON p.id = c.player_id
WHERE c.from_last = 1
  AND c.old_rating + c.variation <> CASE c.rating_type WHEN 'blitz' THEN p.blitz WHEN 'rapid' THEN p.rapid ELSE p.classic END
ORDER BY player_id, rating_type, result_id;
