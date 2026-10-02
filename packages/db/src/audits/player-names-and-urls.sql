-- Players whose stored search name no longer matches the display name.
-- Before the players.update fix, renames wrote only normalized_name, so a row
-- listed here was renamed in the dashboard but kept its old display name.
-- normalized_name holds the intended name without accents or casing; re-enter
-- the correct name in the dashboard for each row instead of copying it back.
-- Approximates normalizeName() for Portuguese diacritics; review each row.
SELECT id, name, normalized_name
FROM players
WHERE normalized_name IS NULL
   OR normalized_name <> replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(trim(name)), 'á', 'a'), 'à', 'a'), 'â', 'a'), 'ã', 'a'), 'ä', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 'í', 'i'), 'ì', 'i'), 'î', 'i'), 'ï', 'i'), 'ó', 'o'), 'ò', 'o'), 'ô', 'o'), 'õ', 'o'), 'ö', 'o'), 'ú', 'u'), 'ù', 'u'), 'û', 'u'), 'ü', 'u'), 'ç', 'c'), 'ñ', 'n'), 'Á', 'a'), 'À', 'a'), 'Â', 'a'), 'Ã', 'a'), 'Ä', 'a'), 'É', 'e'), 'È', 'e'), 'Ê', 'e'), 'Ë', 'e'), 'Í', 'i'), 'Ì', 'i'), 'Î', 'i'), 'Ï', 'i'), 'Ó', 'o'), 'Ò', 'o'), 'Ô', 'o'), 'Õ', 'o'), 'Ö', 'o'), 'Ú', 'u'), 'Ù', 'u'), 'Û', 'u'), 'Ü', 'u'), 'Ç', 'c'), 'Ñ', 'n')
ORDER BY id;

-- Stored URLs the API validators would now reject. Uploaded images must be
-- /api/media/(players|posts)/<uuid>.(jpg|png|webp); everything else must be http(s).
-- D1 allows at most 5 terms per compound SELECT, so the checks are split.
SELECT 'players.image_url' AS field, id, image_url AS value FROM players
WHERE image_url IS NOT NULL AND image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%' AND image_url NOT LIKE '/api/media/players/%' AND image_url NOT LIKE '/api/media/posts/%'
UNION ALL
SELECT 'posts.image_url', id, image_url FROM posts
WHERE image_url IS NOT NULL AND image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%' AND image_url NOT LIKE '/api/media/players/%' AND image_url NOT LIKE '/api/media/posts/%'
UNION ALL
SELECT 'cups.image_url', id, image_url FROM cups
WHERE image_url IS NOT NULL AND image_url NOT LIKE 'http://%' AND image_url NOT LIKE 'https://%' AND image_url NOT LIKE '/api/media/players/%' AND image_url NOT LIKE '/api/media/posts/%';

SELECT 'clubs.logo_url' AS field, id, logo_url AS value FROM clubs
WHERE logo_url IS NOT NULL AND logo_url NOT LIKE 'http://%' AND logo_url NOT LIKE 'https://%'
UNION ALL
SELECT 'locations.flag_url', id, flag_url FROM locations
WHERE flag_url IS NOT NULL AND flag_url NOT LIKE 'http://%' AND flag_url NOT LIKE 'https://%'
UNION ALL
SELECT 'tournaments.chess_results', id, chess_results FROM tournaments
WHERE chess_results IS NOT NULL AND chess_results NOT LIKE 'http://%' AND chess_results NOT LIKE 'https://%'
UNION ALL
SELECT 'links.href', id, href FROM links
WHERE href IS NOT NULL AND href NOT LIKE 'http://%' AND href NOT LIKE 'https://%';
