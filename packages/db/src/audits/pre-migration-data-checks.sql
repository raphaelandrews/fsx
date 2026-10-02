SELECT 'players.sex' AS check_name, COUNT(*) AS invalid_rows FROM players WHERE sex NOT IN ('male', 'female')
UNION ALL
SELECT 'players.rating', COUNT(*) FROM players WHERE blitz NOT BETWEEN 0 AND 4000 OR rapid NOT BETWEEN 0 AND 4000 OR classic NOT BETWEEN 0 AND 4000
UNION ALL
SELECT 'players_to_tournaments.rating', COUNT(*) FROM players_to_tournaments WHERE old_rating NOT BETWEEN 0 AND 4000 OR variation NOT BETWEEN -4000 AND 4000
UNION ALL
SELECT 'tournament_podiums.place', COUNT(*) FROM tournament_podiums WHERE place NOT BETWEEN 1 AND 100000
UNION ALL
SELECT 'circuit_podiums.domain_values', COUNT(*) FROM circuit_podiums
WHERE points NOT BETWEEN 0 AND 1000000
   OR (place IS NOT NULL AND place NOT BETWEEN 1 AND 25)
   OR (category IS NOT NULL AND category NOT IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
   OR ((circuit_id IS NULL) = (circuit_phase_id IS NULL))
UNION ALL
SELECT 'tournaments.rating_type', COUNT(*) FROM tournaments WHERE rating_type NOT IN ('blitz', 'rapid', 'classic')
UNION ALL
SELECT 'cups.rating_type', COUNT(*) FROM cups WHERE rating_type NOT IN ('blitz', 'rapid', 'classic')
UNION ALL
SELECT 'cups.prize_pool', COUNT(*) FROM cups WHERE prize_pool < 0
UNION ALL
SELECT 'players_to_tournaments.rating_type', COUNT(*) FROM players_to_tournaments WHERE rating_type NOT IN ('blitz', 'rapid', 'classic')
UNION ALL
SELECT 'locations.type', COUNT(*) FROM locations WHERE type NOT IN ('city', 'state', 'country')
UNION ALL
SELECT 'roles.type', COUNT(*) FROM roles WHERE type NOT IN ('management', 'referee', 'teacher')
UNION ALL
SELECT 'circuits.type', COUNT(*) FROM circuits WHERE type NOT IN ('default', 'categories', 'school', 'geral')
UNION ALL
SELECT 'cup_brackets.bracket_type', COUNT(*) FROM cup_brackets WHERE bracket_type NOT IN ('UB', 'LB', 'GF')
UNION ALL
SELECT 'cup_playoffs.phase_type', COUNT(*) FROM cup_playoffs WHERE phase_type NOT IN ('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior')
UNION ALL
SELECT 'titles.type', COUNT(*) FROM titles WHERE type NOT IN ('internal', 'external')
UNION ALL
SELECT 'links.type', COUNT(*) FROM links WHERE type NOT IN ('link', 'regulation', 'form', 'results')
UNION ALL
SELECT 'tv_sergipe.domain_values', COUNT(*) FROM tv_sergipe
WHERE age_group NOT IN ('8', '10', '12', '14', '16', '18')
   OR sex NOT IN ('male', 'female')
   OR modality NOT IN ('individual', 'team')
   OR place NOT BETWEEN 1 AND 8
   OR points NOT BETWEEN 1 AND 10
   OR NOT ((modality = 'individual' AND player_id IS NOT NULL AND team_name IS NULL)
        OR (modality = 'team' AND player_id IS NULL AND team_name IS NOT NULL))
UNION ALL
SELECT 'timestamps.' || table_name, COUNT(*) FROM (
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
) AS timestamp_rows
WHERE created_at IS NULL OR updated_at IS NULL
GROUP BY table_name;
