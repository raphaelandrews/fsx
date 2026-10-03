-- Rows that would violate the CHECK and NOT NULL constraints. Every count must
-- be 0 before a migration adds or tightens these constraints. Read-only.
-- D1 allows at most 5 terms per compound SELECT; a multi-row VALUES list is not
-- subject to that limit, so each check is one scalar subquery row.
WITH checks(check_name, invalid_rows) AS (
  VALUES
  ('players.sex', (SELECT COUNT(*) FROM players WHERE sex NOT IN ('male', 'female'))),
  ('players.rating', (SELECT COUNT(*) FROM players WHERE blitz NOT BETWEEN 0 AND 4000 OR rapid NOT BETWEEN 0 AND 4000 OR classic NOT BETWEEN 0 AND 4000)),
  ('players_to_tournaments.rating', (SELECT COUNT(*) FROM players_to_tournaments WHERE old_rating NOT BETWEEN 0 AND 4000 OR variation NOT BETWEEN -4000 AND 4000)),
  ('tournament_podiums.place', (SELECT COUNT(*) FROM tournament_podiums WHERE place NOT BETWEEN 1 AND 100000)),
  ('circuit_podiums.domain_values', (SELECT COUNT(*) FROM circuit_podiums
    WHERE points NOT BETWEEN 0 AND 1000000
       OR (place IS NOT NULL AND place NOT BETWEEN 1 AND 1000)
       OR (category IS NOT NULL AND category NOT IN ('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'))
       OR ((circuit_id IS NULL) = (circuit_phase_id IS NULL)))),
  ('tournaments.rating_type', (SELECT COUNT(*) FROM tournaments WHERE rating_type NOT IN ('blitz', 'rapid', 'classic'))),
  ('cups.rating_type', (SELECT COUNT(*) FROM cups WHERE rating_type NOT IN ('blitz', 'rapid', 'classic'))),
  ('cups.prize_pool', (SELECT COUNT(*) FROM cups WHERE prize_pool < 0)),
  ('players_to_tournaments.rating_type', (SELECT COUNT(*) FROM players_to_tournaments WHERE rating_type NOT IN ('blitz', 'rapid', 'classic'))),
  ('locations.type', (SELECT COUNT(*) FROM locations WHERE type NOT IN ('city', 'state', 'country'))),
  ('roles.type', (SELECT COUNT(*) FROM roles WHERE type NOT IN ('management', 'referee', 'teacher'))),
  ('circuits.type', (SELECT COUNT(*) FROM circuits WHERE type NOT IN ('default', 'categories', 'school', 'geral'))),
  ('cup_brackets.bracket_type', (SELECT COUNT(*) FROM cup_brackets WHERE bracket_type NOT IN ('UB', 'LB', 'GF'))),
  ('cup_playoffs.phase_type', (SELECT COUNT(*) FROM cup_playoffs WHERE phase_type NOT IN ('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior'))),
  ('titles.type', (SELECT COUNT(*) FROM titles WHERE type NOT IN ('internal', 'external'))),
  ('links.type', (SELECT COUNT(*) FROM links WHERE type NOT IN ('link', 'regulation', 'form', 'results'))),
  ('tv_sergipe.domain_values', (SELECT COUNT(*) FROM tv_sergipe
    WHERE age_group NOT IN ('8', '10', '12', '14', '16', '18')
       OR sex NOT IN ('male', 'female')
       OR modality NOT IN ('individual', 'team')
       OR place NOT BETWEEN 1 AND 8
       OR points NOT BETWEEN 1 AND 10
       OR NOT ((modality = 'individual' AND player_id IS NOT NULL AND team_name IS NULL)
            OR (modality = 'team' AND player_id IS NULL AND team_name IS NOT NULL)))),
  ('timestamps.announcements', (SELECT COUNT(*) FROM announcements WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.championships', (SELECT COUNT(*) FROM championships WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.circuit_phases', (SELECT COUNT(*) FROM circuit_phases WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.circuit_podiums', (SELECT COUNT(*) FROM circuit_podiums WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.circuits', (SELECT COUNT(*) FROM circuits WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.clubs', (SELECT COUNT(*) FROM clubs WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_brackets', (SELECT COUNT(*) FROM cup_brackets WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_games', (SELECT COUNT(*) FROM cup_games WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_groups', (SELECT COUNT(*) FROM cup_groups WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_matches', (SELECT COUNT(*) FROM cup_matches WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_players', (SELECT COUNT(*) FROM cup_players WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_playoffs', (SELECT COUNT(*) FROM cup_playoffs WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cup_rounds', (SELECT COUNT(*) FROM cup_rounds WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.cups', (SELECT COUNT(*) FROM cups WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.defending_champions', (SELECT COUNT(*) FROM defending_champions WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.events', (SELECT COUNT(*) FROM events WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.insignias', (SELECT COUNT(*) FROM insignias WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.link_groups', (SELECT COUNT(*) FROM link_groups WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.links', (SELECT COUNT(*) FROM links WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.locations', (SELECT COUNT(*) FROM locations WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.norms', (SELECT COUNT(*) FROM norms WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players', (SELECT COUNT(*) FROM players WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players_to_insignias', (SELECT COUNT(*) FROM players_to_insignias WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players_to_norms', (SELECT COUNT(*) FROM players_to_norms WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players_to_roles', (SELECT COUNT(*) FROM players_to_roles WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players_to_titles', (SELECT COUNT(*) FROM players_to_titles WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.players_to_tournaments', (SELECT COUNT(*) FROM players_to_tournaments WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.posts', (SELECT COUNT(*) FROM posts WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.roles', (SELECT COUNT(*) FROM roles WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.titles', (SELECT COUNT(*) FROM titles WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.tournament_podiums', (SELECT COUNT(*) FROM tournament_podiums WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.tournaments', (SELECT COUNT(*) FROM tournaments WHERE created_at IS NULL OR updated_at IS NULL)),
  ('timestamps.tv_sergipe', (SELECT COUNT(*) FROM tv_sergipe WHERE created_at IS NULL OR updated_at IS NULL))
)
SELECT check_name, invalid_rows FROM checks
WHERE invalid_rows > 0
ORDER BY check_name;
