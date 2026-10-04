-- What the next ranking update (rating import or "Update rankings now") would
-- change, before it runs. Mirrors snapshotRankings in
-- packages/api/src/routers/rating-update.ts; uses D1's UTC date, so around
-- midnight it can differ by a day from the federation's (America/Sao_Paulo).
-- Read-only. Run after the migrations that add titles.tier and loses_at_age.

-- Active players who would become inactive: no dated rating result, podium, or
-- circuit stage in 3 years, and registered more than 3 years ago.
SELECT 'would become inactive' AS change, p.id, p.name
FROM players p
WHERE p.active = 1 AND p.created_at < date('now', '-3 years')
  AND NOT EXISTS (
    SELECT 1 FROM players_to_tournaments h JOIN tournaments t ON t.id = h.tournament_id
    WHERE h.player_id = p.id AND COALESCE(t.date, h.created_at) >= date('now', '-3 years'))
  AND NOT EXISTS (
    SELECT 1 FROM tournament_podiums tp JOIN tournaments t ON t.id = tp.tournament_id
    WHERE tp.player_id = p.id AND COALESCE(t.date, tp.created_at) >= date('now', '-3 years'))
  AND NOT EXISTS (
    SELECT 1 FROM circuit_podiums c
    JOIN circuit_phases f ON f.id = c.circuit_phase_id JOIN tournaments t ON t.id = f.tournament_id
    WHERE c.player_id = p.id AND COALESCE(t.date, c.created_at) >= date('now', '-3 years'))
ORDER BY p.name;

-- Youth titles that would be removed, and those that cannot be checked.
SELECT CASE WHEN p.birth_date IS NULL THEN 'cannot expire: no birth date' ELSE 'title would be removed' END AS change,
  p.id, p.name, t.short_name AS title, p.birth_date
FROM players_to_titles pt
JOIN titles t ON t.id = pt.title_id
JOIN players p ON p.id = pt.player_id
WHERE t.loses_at_age IS NOT NULL
  AND (p.birth_date IS NULL
    OR CAST(substr(p.birth_date, 1, 4) AS INTEGER) + t.loses_at_age <= CAST(strftime('%Y', 'now') AS INTEGER))
ORDER BY change, p.name;

-- The title settings the migrations filled in by name; check them before the
-- first update (a title spelled differently in production has no age limit).
SELECT id, name, short_name, type, tier, loses_at_age FROM titles ORDER BY tier DESC, name;
