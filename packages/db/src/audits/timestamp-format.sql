SELECT table_name, COUNT(*) AS noncanonical_timestamps FROM (
  SELECT 'announcements' AS table_name, created_at, updated_at FROM announcements UNION ALL
  SELECT 'championships', created_at, updated_at FROM championships UNION ALL
  SELECT 'circuit_phases', created_at, updated_at FROM circuit_phases UNION ALL
  SELECT 'circuit_podiums', created_at, updated_at FROM circuit_podiums UNION ALL
  SELECT 'circuits', created_at, updated_at FROM circuits UNION ALL
  SELECT 'clubs', created_at, updated_at FROM clubs UNION ALL
  SELECT 'cup_brackets', created_at, updated_at FROM cup_brackets UNION ALL
  SELECT 'cup_games', created_at, updated_at FROM cup_games UNION ALL
  SELECT 'cup_groups', created_at, updated_at FROM cup_groups UNION ALL
  SELECT 'cup_matches', created_at, updated_at FROM cup_matches UNION ALL
  SELECT 'cup_players', created_at, updated_at FROM cup_players UNION ALL
  SELECT 'cup_playoffs', created_at, updated_at FROM cup_playoffs UNION ALL
  SELECT 'cup_rounds', created_at, updated_at FROM cup_rounds UNION ALL
  SELECT 'cups', created_at, updated_at FROM cups UNION ALL
  SELECT 'defending_champions', created_at, updated_at FROM defending_champions UNION ALL
  SELECT 'events', created_at, updated_at FROM events UNION ALL
  SELECT 'insignias', created_at, updated_at FROM insignias UNION ALL
  SELECT 'link_groups', created_at, updated_at FROM link_groups UNION ALL
  SELECT 'links', created_at, updated_at FROM links UNION ALL
  SELECT 'locations', created_at, updated_at FROM locations UNION ALL
  SELECT 'norms', created_at, updated_at FROM norms UNION ALL
  SELECT 'players', created_at, updated_at FROM players UNION ALL
  SELECT 'players_to_insignias', created_at, updated_at FROM players_to_insignias UNION ALL
  SELECT 'players_to_norms', created_at, updated_at FROM players_to_norms UNION ALL
  SELECT 'players_to_roles', created_at, updated_at FROM players_to_roles UNION ALL
  SELECT 'players_to_titles', created_at, updated_at FROM players_to_titles UNION ALL
  SELECT 'players_to_tournaments', created_at, updated_at FROM players_to_tournaments UNION ALL
  SELECT 'posts', created_at, updated_at FROM posts UNION ALL
  SELECT 'roles', created_at, updated_at FROM roles UNION ALL
  SELECT 'titles', created_at, updated_at FROM titles UNION ALL
  SELECT 'tournament_podiums', created_at, updated_at FROM tournament_podiums UNION ALL
  SELECT 'tournaments', created_at, updated_at FROM tournaments UNION ALL
  SELECT 'tv_sergipe', created_at, updated_at FROM tv_sergipe
) AS domain_timestamps
WHERE created_at NOT GLOB '????-??-?? ??:??:??'
   OR updated_at NOT GLOB '????-??-?? ??:??:??'
   OR strftime('%Y-%m-%d %H:%M:%S', created_at) IS NULL
   OR strftime('%Y-%m-%d %H:%M:%S', updated_at) IS NULL
GROUP BY table_name;
