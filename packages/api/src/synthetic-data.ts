// Deterministic, production-sized fixture data for measurement runs. Values are
// derived from the row index, so every run produces identical data and plans.
export type SyntheticCounts = {
  players: number;
  activePlayers: number;
  clubs: number;
  locations: number;
  titles: number;
  roles: number;
  championships: number;
  tournaments: number;
  tournamentPodiums: number;
  playersToTournaments: number;
  maxTournamentsPerPlayer: number;
  playersToTitles: number;
  playersToRoles: number;
  defendingChampions: number;
  circuits: number;
  circuitPhases: number;
  circuitPodiums: number;
  posts: number;
  postContentChars: number;
  announcements: number;
  announcementChars: number;
  events: number;
  links: number;
  tvSergipe: number;
};

export const DEFAULT_SYNTHETIC_COUNTS: SyntheticCounts = {
  players: 3_000,
  activePlayers: 2_000,
  clubs: 60,
  locations: 40,
  titles: 12,
  roles: 10,
  championships: 20,
  tournaments: 400,
  tournamentPodiums: 1_200,
  playersToTournaments: 25_000,
  maxTournamentsPerPlayer: 80,
  playersToTitles: 400,
  playersToRoles: 40,
  defendingChampions: 30,
  circuits: 10,
  circuitPhases: 60,
  circuitPodiums: 3_000,
  posts: 300,
  postContentChars: 3_000,
  announcements: 200,
  announcementChars: 1_500,
  events: 100,
  links: 300,
  tvSergipe: 500,
};

const series = (count: number) =>
  `WITH RECURSIVE n(i) AS (SELECT 1 WHERE ${count} > 0 UNION ALL SELECT i + 1 FROM n WHERE i < ${count})`;

const pick = (expression: string, modulo: number) => `((${expression}) % ${Math.max(1, modulo)}) + 1`;

export async function seedSyntheticData(db: D1Database, counts: SyntheticCounts = DEFAULT_SYNTHETIC_COUNTS) {
  const c = counts;
  const heavy = Math.min(c.maxTournamentsPerPlayer, c.tournaments, c.playersToTournaments);
  const text = (chars: number) => `substr(replace(hex(zeroblob(${Math.ceil(chars / 2)})), '00', 'lorem ipsum '), 1, ${chars})`;
  const statements = [
    `INSERT INTO clubs (id, name) ${series(c.clubs)} SELECT i, 'Clube ' || i FROM n`,
    `INSERT INTO locations (id, name, type) ${series(c.locations)} SELECT i, 'Cidade ' || i, 'city' FROM n`,
    `INSERT INTO titles (id, name, short_name, type) ${series(c.titles)} SELECT i, 'Título ' || i, 'T' || i, CASE WHEN i % 2 THEN 'internal' ELSE 'external' END FROM n`,
    `INSERT INTO roles (id, name, short_name, type) ${series(c.roles)} SELECT i, 'Cargo ' || i, 'R' || i, CASE i % 3 WHEN 0 THEN 'management' WHEN 1 THEN 'referee' ELSE 'teacher' END FROM n`,
    `INSERT INTO championships (id, name) ${series(c.championships)} SELECT i, 'Campeonato ' || i FROM n`,
    `INSERT INTO players (id, name, normalized_name, sex, active, blitz, rapid, classic, birth_date, club_id, location_id)
      ${series(c.players)} SELECT i, 'Jogador Sintético ' || i, 'jogador sintetico ' || i,
        CASE WHEN i % 3 = 0 THEN 'female' ELSE 'male' END,
        CASE WHEN i <= ${c.activePlayers} THEN 1 ELSE 0 END,
        1000 + (i * 37) % 1500, 1000 + (i * 53) % 1500, 1000 + (i * 71) % 1500,
        printf('%04d-%02d-%02d', 1950 + (i * 13) % 70, 1 + (i * 7) % 12, 1 + (i * 11) % 28),
        ${pick("i * 7", c.clubs)}, ${pick("i * 5", c.locations)}
      FROM n`,
    `INSERT INTO tournaments (id, name, date, rating_type, championship_id) ${series(c.tournaments)}
      SELECT i, 'Torneio ' || i, printf('%04d-%02d-%02d', 2015 + i % 11, 1 + i % 12, 1 + i % 28),
        CASE i % 3 WHEN 0 THEN 'blitz' WHEN 1 THEN 'rapid' ELSE 'classic' END,
        CASE WHEN i % 4 = 0 THEN ${pick("i", c.championships)} END FROM n`,
    `INSERT INTO tournament_podiums (player_id, tournament_id, place) ${series(c.tournamentPodiums)}
      SELECT ((i - 1) % ${c.players}) + 1, ((i - 1) / ${c.players}) % ${c.tournaments} + 1, 1 + i % 3 FROM n`,
    // Player 1 gets the heaviest history so players.byId measures the worst case.
    `INSERT INTO players_to_tournaments (player_id, tournament_id, old_rating, variation, rating_type) ${series(c.playersToTournaments)}
      SELECT CASE WHEN i <= ${heavy} THEN 1 ELSE ((i - ${heavy} - 1) % ${c.players - 1}) + 2 END,
        CASE WHEN i <= ${heavy} THEN i ELSE ((i - ${heavy} - 1) / ${c.players - 1}) % ${c.tournaments} + 1 END,
        1200 + i % 800, (i % 41) - 20,
        CASE i % 3 WHEN 0 THEN 'blitz' WHEN 1 THEN 'rapid' ELSE 'classic' END FROM n`,
    `INSERT INTO players_to_titles (player_id, title_id) ${series(c.playersToTitles)}
      SELECT ((i - 1) % ${c.players}) + 1, ((i - 1) / ${c.players}) % ${c.titles} + 1 FROM n`,
    `INSERT INTO players_to_roles (player_id, role_id) ${series(c.playersToRoles)}
      SELECT ((i - 1) % ${c.players}) + 1, ((i - 1) / ${c.players}) % ${c.roles} + 1 FROM n`,
    `INSERT INTO defending_champions (player_id, championship_id) ${series(c.defendingChampions)}
      SELECT ((i - 1) % ${c.players}) + 1, ((i - 1) / ${c.players}) % ${c.championships} + 1 FROM n`,
    `INSERT INTO circuits (id, name, type) ${series(c.circuits)}
      SELECT i, 'Circuito ' || i, CASE i % 4 WHEN 0 THEN 'default' WHEN 1 THEN 'categories' WHEN 2 THEN 'school' ELSE 'geral' END FROM n`,
    `INSERT INTO circuit_phases (id, circuit_id, tournament_id, club_id, sort_order) ${series(c.circuitPhases)}
      SELECT i, ${pick("i", c.circuits)}, ${pick("i * 3", c.tournaments)}, ${pick("i", c.clubs)}, i FROM n`,
    `INSERT INTO circuit_podiums (player_id, circuit_phase_id, place, points) ${series(c.circuitPodiums)}
      SELECT ${pick("i * 13", c.players)}, ${pick("i", c.circuitPhases)}, 1 + i % 25, (i * 17) % 100 FROM n`,
    `INSERT INTO posts (id, title, slug, content, published, created_at, updated_at) ${series(c.posts)}
      SELECT i, 'Notícia sintética ' || i, 'noticia-sintetica-' || i, ${text(c.postContentChars)}, i % 10 != 0,
        printf('%04d-%02d-%02dT12:00:00.000Z', 2018 + i % 8, 1 + i % 12, 1 + i % 28),
        printf('%04d-%02d-%02dT12:00:00.000Z', 2018 + i % 8, 1 + i % 12, 1 + i % 28) FROM n`,
    `INSERT INTO announcements (id, year, number, content) ${series(c.announcements)}
      SELECT i, 2000 + (i - 1) / 50, ((i - 1) % 50) + 1, i || ' ' || ${text(c.announcementChars)} FROM n`,
    `INSERT INTO events (id, name, start_date) ${series(c.events)}
      SELECT i, 'Evento ' || i, printf('%04d-%02d-%02d', 2020 + i % 7, 1 + i % 12, 1 + i % 28) FROM n`,
    `INSERT INTO link_groups (id, label, event_id) ${series(c.events)} SELECT i, 'Links', i FROM n`,
    `INSERT INTO links (href, label, icon, type, sort_order, link_group_id) ${series(c.links)}
      SELECT 'https://example.com/' || i, 'Link ' || i, '<svg></svg>', 'regulation', i, ${pick("i", c.events)} FROM n`,
    `INSERT INTO tv_sergipe (club_id, player_id, age_group, sex, modality, place, points) ${series(c.tvSergipe)}
      SELECT ${pick("i", c.clubs)}, i, CASE i % 6 WHEN 0 THEN '8' WHEN 1 THEN '10' WHEN 2 THEN '12' WHEN 3 THEN '14' WHEN 4 THEN '16' ELSE '18' END,
        CASE WHEN i % 2 THEN 'male' ELSE 'female' END, 'individual', 1 + i % 8,
        CASE 1 + i % 8 WHEN 1 THEN 10 WHEN 2 THEN 8 WHEN 3 THEN 6 WHEN 4 THEN 5 WHEN 5 THEN 4 WHEN 6 THEN 3 WHEN 7 THEN 2 ELSE 1 END FROM n`,
  ];
  for (const statement of statements) await db.prepare(statement).run();
}
