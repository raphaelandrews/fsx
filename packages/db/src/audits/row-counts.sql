-- Row counts and size distributions only (no personal data), for sizing
-- synthetic measurement data. D1 allows at most 5 terms per compound SELECT.
SELECT 'players' AS table_name, COUNT(*) AS row_count FROM players
UNION ALL
SELECT 'clubs' AS table_name, COUNT(*) AS row_count FROM clubs
UNION ALL
SELECT 'locations' AS table_name, COUNT(*) AS row_count FROM locations
UNION ALL
SELECT 'titles' AS table_name, COUNT(*) AS row_count FROM titles
UNION ALL
SELECT 'roles' AS table_name, COUNT(*) AS row_count FROM roles;
SELECT 'insignias' AS table_name, COUNT(*) AS row_count FROM insignias
UNION ALL
SELECT 'norms' AS table_name, COUNT(*) AS row_count FROM norms
UNION ALL
SELECT 'championships' AS table_name, COUNT(*) AS row_count FROM championships
UNION ALL
SELECT 'tournaments' AS table_name, COUNT(*) AS row_count FROM tournaments
UNION ALL
SELECT 'tournament_podiums' AS table_name, COUNT(*) AS row_count FROM tournament_podiums;
SELECT 'players_to_tournaments' AS table_name, COUNT(*) AS row_count FROM players_to_tournaments
UNION ALL
SELECT 'players_to_titles' AS table_name, COUNT(*) AS row_count FROM players_to_titles
UNION ALL
SELECT 'players_to_roles' AS table_name, COUNT(*) AS row_count FROM players_to_roles
UNION ALL
SELECT 'players_to_insignias' AS table_name, COUNT(*) AS row_count FROM players_to_insignias
UNION ALL
SELECT 'defending_champions' AS table_name, COUNT(*) AS row_count FROM defending_champions;
SELECT 'circuits' AS table_name, COUNT(*) AS row_count FROM circuits
UNION ALL
SELECT 'circuit_phases' AS table_name, COUNT(*) AS row_count FROM circuit_phases
UNION ALL
SELECT 'circuit_podiums' AS table_name, COUNT(*) AS row_count FROM circuit_podiums
UNION ALL
SELECT 'posts' AS table_name, COUNT(*) AS row_count FROM posts
UNION ALL
SELECT 'announcements' AS table_name, COUNT(*) AS row_count FROM announcements;
SELECT 'events' AS table_name, COUNT(*) AS row_count FROM events
UNION ALL
SELECT 'link_groups' AS table_name, COUNT(*) AS row_count FROM link_groups
UNION ALL
SELECT 'links' AS table_name, COUNT(*) AS row_count FROM links
UNION ALL
SELECT 'tv_sergipe' AS table_name, COUNT(*) AS row_count FROM tv_sergipe
UNION ALL
SELECT 'cups' AS table_name, COUNT(*) AS row_count FROM cups;
SELECT 'cup_players' AS table_name, COUNT(*) AS row_count FROM cup_players
UNION ALL
SELECT 'cup_matches' AS table_name, COUNT(*) AS row_count FROM cup_matches
UNION ALL
SELECT 'cup_games' AS table_name, COUNT(*) AS row_count FROM cup_games;

SELECT 'max titles per player' AS metric, MAX(c) AS value FROM (SELECT COUNT(*) c FROM players_to_titles GROUP BY player_id)
UNION ALL SELECT 'max tournaments per player', MAX(c) FROM (SELECT COUNT(*) c FROM players_to_tournaments GROUP BY player_id)
UNION ALL SELECT 'max players per role', MAX(c) FROM (SELECT COUNT(*) c FROM players_to_roles GROUP BY role_id)
UNION ALL SELECT 'max podiums per circuit phase', MAX(c) FROM (SELECT COUNT(*) c FROM circuit_podiums GROUP BY circuit_phase_id)
UNION ALL SELECT 'max phases per circuit', MAX(c) FROM (SELECT COUNT(*) c FROM circuit_phases GROUP BY circuit_id);

SELECT 'active players' AS metric, COUNT(*) AS value FROM players WHERE active = 1
UNION ALL SELECT 'published posts', COUNT(*) FROM posts WHERE published = 1
UNION ALL SELECT 'avg post content chars', CAST(AVG(LENGTH(content)) AS INTEGER) FROM posts
UNION ALL SELECT 'max post content chars', MAX(LENGTH(content)) FROM posts
UNION ALL SELECT 'avg announcement chars', CAST(AVG(LENGTH(content)) AS INTEGER) FROM announcements;
