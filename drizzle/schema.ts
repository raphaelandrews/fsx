import { pgTable, unique, pgPolicy, serial, varchar, foreignKey, integer, smallint, text, date, uniqueIndex, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bracketType = pgEnum("bracket_type", ['UB', 'LB', 'GF'])
export const circuitCategory = pgEnum("circuit_category", ['Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master'])
export const circuitPlace = pgEnum("circuit_place", ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'])
export const circuitType = pgEnum("circuit_type", ['default', 'categories', 'school'])
export const locationType = pgEnum("location_type", ['city', 'state', 'country'])
export const phaseType = pgEnum("phase_type", ['Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior'])
export const ratingType = pgEnum("rating_type", ['blitz', 'rapid', 'classic'])
export const roleType = pgEnum("role_type", ['management', 'referee', 'teacher'])
export const titleType = pgEnum("title_type", ['internal', 'external'])


export const circuits = pgTable("circuits", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	type: circuitType().notNull(),
}, (table) => [
	unique("circuits_name_unique").on(table.name),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const cupGames = pgTable("cup_games", {
	id: serial().primaryKey().notNull(),
	winnerId: integer("winner_id"),
	cupMatchId: integer("cup_match_id").notNull(),
	gameNumber: smallint("game_number").notNull(),
	link: text(),
}, (table) => [
	foreignKey({
			columns: [table.cupMatchId],
			foreignColumns: [cupMatches.id],
			name: "cup_games_cup_match_id_cup_matches_id_fk"
		}),
	foreignKey({
			columns: [table.winnerId],
			foreignColumns: [players.id],
			name: "cup_games_winner_id_players_id_fk"
		}),
]);

export const cupGroups = pgTable("cup_groups", {
	id: serial().primaryKey().notNull(),
	cupId: integer("cup_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	order: smallint().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cupId],
			foreignColumns: [cups.id],
			name: "cup_groups_cup_id_cups_id_fk"
		}),
]);

export const cupPlayers = pgTable("cup_players", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	cupGroupId: integer("cup_group_id").notNull(),
	nickname: varchar({ length: 40 }),
	position: smallint(),
}, (table) => [
	foreignKey({
			columns: [table.cupGroupId],
			foreignColumns: [cupGroups.id],
			name: "cup_players_cup_group_id_cup_groups_id_fk"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "cup_players_player_id_players_id_fk"
		}),
	unique("cup_players_nickname_unique").on(table.nickname),
]);

export const cups = pgTable("cups", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	imageUrl: text("image_url").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	prizePool: integer("prize_pool").notNull(),
	rhythm: varchar({ length: 20 }).notNull(),
	championshipId: integer("championship_id"),
}, (table) => [
	foreignKey({
			columns: [table.championshipId],
			foreignColumns: [championships.id],
			name: "cups_championship_id_championships_id_fk"
		}),
	unique("cups_name_unique").on(table.name),
]);

export const defendingChampions = pgTable("defending_champions", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	championshipId: integer("championship_id").notNull(),
}, (table) => [
	uniqueIndex("defending_champion").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.championshipId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.championshipId],
			foreignColumns: [championships.id],
			name: "defending_champions_championship_id_championships_id_fk"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "defending_champions_player_id_players_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const players = pgTable("players", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	nickname: varchar({ length: 20 }),
	blitz: smallint().default(1900).notNull(),
	rapid: smallint().default(1900).notNull(),
	classic: smallint().default(1900).notNull(),
	active: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	description: text(),
	imageUrl: text("image_url"),
	cbxId: integer("cbx_id"),
	fideId: integer("fide_id"),
	verified: boolean().default(false),
	birth: date(),
	sex: boolean().default(false),
	clubId: integer("club_id"),
	locationId: integer("location_id"),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "players_club_id_clubs_id_fk"
		}),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "players_location_id_locations_id_fk"
		}),
	unique("players_nickname_unique").on(table.nickname),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Enable update for authenticated users only", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);

export const tournaments = pgTable("tournaments", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	chessResults: text("chess_results"),
	date: date(),
	championshipId: integer("championship_id"),
}, (table) => [
	foreignKey({
			columns: [table.championshipId],
			foreignColumns: [championships.id],
			name: "tournaments_championship_id_championships_id_fk"
		}),
	unique("tournaments_name_unique").on(table.name),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const circuitPhases = pgTable("circuit_phases", {
	id: serial().primaryKey().notNull(),
	tournamentId: integer("tournament_id").notNull(),
	clubId: integer("club_id"),
	circuitId: integer("circuit_id").notNull(),
	order: smallint().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.circuitId],
			foreignColumns: [circuits.id],
			name: "circuit_phases_circuit_id_circuits_id_fk"
		}),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "circuit_phases_club_id_clubs_id_fk"
		}),
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "circuit_phases_tournament_id_tournaments_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const championships = pgTable("championships", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
}, (table) => [
	unique("championships_name_unique").on(table.name),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const circuitPodiums = pgTable("circuit_podiums", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	clubId: integer("club_id"),
	circuitPhaseId: integer("circuit_phase_id").notNull(),
	category: circuitCategory(),
	place: circuitPlace().notNull(),
	points: smallint().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.circuitPhaseId],
			foreignColumns: [circuitPhases.id],
			name: "circuit_podiums_circuit_phase_id_circuit_phases_id_fk"
		}),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubs.id],
			name: "circuit_podiums_club_id_clubs_id_fk"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "circuit_podiums_player_id_players_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const clubs = pgTable("clubs", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	logo: text(),
}, (table) => [
	unique("clubs_name_unique").on(table.name),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const cupMatches = pgTable("cup_matches", {
	id: serial().primaryKey().notNull(),
	playerOneId: integer("player_one_id").notNull(),
	playerTwoId: integer("player_two_id").notNull(),
	winnerId: integer("winner_id"),
	bestOf: smallint("best_of").notNull(),
	order: smallint().notNull(),
	date: date().notNull(),
	cupRoundId: integer("cup_round_id"),
	cupPlayoffId: integer("cup_playoff_id"),
}, (table) => [
	foreignKey({
			columns: [table.cupPlayoffId],
			foreignColumns: [cupPlayoffs.id],
			name: "cup_matches_cup_playoff_id_cup_playoffs_id_fk"
		}),
	foreignKey({
			columns: [table.cupRoundId],
			foreignColumns: [cupRounds.id],
			name: "cup_matches_cup_round_id_cup_rounds_id_fk"
		}),
	foreignKey({
			columns: [table.playerOneId],
			foreignColumns: [players.id],
			name: "cup_matches_player_one_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.playerTwoId],
			foreignColumns: [players.id],
			name: "cup_matches_player_two_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.winnerId],
			foreignColumns: [players.id],
			name: "cup_matches_winner_id_players_id_fk"
		}),
]);

export const cupPlayoffs = pgTable("cup_playoffs", {
	id: serial().primaryKey().notNull(),
	cupBracketId: integer("cup_bracket_id").notNull(),
	phaseType: phaseType("phase_type").notNull(),
	order: smallint().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cupBracketId],
			foreignColumns: [cupBrackets.id],
			name: "cup_playoffs_cup_bracket_id_cup_brackets_id_fk"
		}),
]);

export const locations = pgTable("locations", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	type: locationType().notNull(),
	flag: text(),
}, (table) => [
	unique("locations_name_unique").on(table.name),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const links = pgTable("links", {
	id: serial().primaryKey().notNull(),
	href: text().notNull(),
	label: varchar({ length: 50 }).notNull(),
	icon: text().notNull(),
	order: smallint().notNull(),
	linkGroupId: integer("link_group_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.linkGroupId],
			foreignColumns: [linkGroups.id],
			name: "links_link_group_id_link_groups_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const norms = pgTable("norms", {
	id: serial().primaryKey().notNull(),
	norm: varchar({ length: 80 }).notNull(),
}, (table) => [
	unique("norms_norm_unique").on(table.norm),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	role: varchar({ length: 80 }).notNull(),
	shortRole: varchar("short_role", { length: 4 }).notNull(),
	type: roleType().notNull(),
}, (table) => [
	unique("roles_role_unique").on(table.role),
	unique("roles_short_role_unique").on(table.shortRole),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const playersToNorms = pgTable("players_to_norms", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	normId: integer("norm_id").notNull(),
}, (table) => [
	uniqueIndex("player_norm").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.normId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.normId],
			foreignColumns: [norms.id],
			name: "players_to_norms_norm_id_norms_id_fk"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "players_to_norms_player_id_players_id_fk"
		}),
]);

export const playersToRoles = pgTable("players_to_roles", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	roleId: integer("role_id").notNull(),
}, (table) => [
	uniqueIndex("player_role").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.roleId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "players_to_roles_player_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "players_to_roles_role_id_roles_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const playersToTitles = pgTable("players_to_titles", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	titleId: integer("title_id").notNull(),
}, (table) => [
	uniqueIndex("player_title").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.titleId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "players_to_titles_player_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.titleId],
			foreignColumns: [titles.id],
			name: "players_to_titles_title_id_titles_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const playersToTournaments = pgTable("players_to_tournaments", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	tournamentId: integer("tournament_id").notNull(),
	ratingType: ratingType("rating_type").notNull(),
	oldRating: smallint("old_rating").notNull(),
	variation: smallint().notNull(),
}, (table) => [
	uniqueIndex("player_tournament").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.tournamentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "players_to_tournaments_player_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "players_to_tournaments_tournament_id_tournaments_id_fk"
		}),
	pgPolicy("Enable update for authenticated users only", { as: "permissive", for: "update", to: ["authenticated"], using: sql`true`, withCheck: sql`true`  }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Enable insert for authenticated users only", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);

export const posts = pgTable("posts", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 80 }).notNull(),
	image: text().notNull(),
	content: text().notNull(),
	slug: text().notNull(),
	authorId: text("author_id").notNull(),
	published: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "posts_author_id_profiles_id_fk"
		}),
	unique("posts_slug_unique").on(table.slug),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const profiles = pgTable("profiles", {
	id: text().primaryKey().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	username: text().notNull(),
	fullName: text("full_name").notNull(),
	avatarUrl: text("avatar_url").notNull(),
}, (table) => [
	unique("profiles_username_unique").on(table.username),
]);

export const titles = pgTable("titles", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 40 }).notNull(),
	shortTitle: varchar("short_title", { length: 4 }).notNull(),
	type: titleType().notNull(),
}, (table) => [
	unique("titles_title_unique").on(table.title),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const tournamentPodiums = pgTable("tournament_podiums", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	tournamentId: integer("tournament_id").notNull(),
	place: smallint().notNull(),
}, (table) => [
	uniqueIndex("player_tournament_podium").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.tournamentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "tournament_podiums_player_id_players_id_fk"
		}),
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "tournament_podiums_tournament_id_tournaments_id_fk"
		}),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const cupBrackets = pgTable("cup_brackets", {
	id: serial().primaryKey().notNull(),
	cupId: integer("cup_id").notNull(),
	bracketType: bracketType("bracket_type").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cupId],
			foreignColumns: [cups.id],
			name: "cup_brackets_cup_id_cups_id_fk"
		}),
]);

export const linkGroups = pgTable("link_groups", {
	id: serial().primaryKey().notNull(),
	label: varchar({ length: 50 }).notNull(),
}, (table) => [
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const insignias = pgTable("insignias", {
	id: serial().primaryKey().notNull(),
	insignia: varchar({ length: 80 }).notNull(),
	level: smallint().notNull(),
}, (table) => [
	unique("insignias_insignia_unique").on(table.insignia),
]);

export const playersToInsignias = pgTable("players_to_insignias", {
	id: serial().primaryKey().notNull(),
	playerId: integer("player_id").notNull(),
	insigniaId: integer("insignia_id").notNull(),
}, (table) => [
	uniqueIndex("player_insignia").using("btree", table.playerId.asc().nullsLast().op("int4_ops"), table.insigniaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.insigniaId],
			foreignColumns: [insignias.id],
			name: "players_to_insignias_insignia_id_insignias_id_fk"
		}),
	foreignKey({
			columns: [table.playerId],
			foreignColumns: [players.id],
			name: "players_to_insignias_player_id_players_id_fk"
		}),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	year: smallint().notNull(),
	number: varchar({ length: 3 }).notNull(),
	content: text().notNull(),
}, (table) => [
	uniqueIndex("year_number").using("btree", table.year.asc().nullsLast().op("int2_ops"), table.number.asc().nullsLast().op("int2_ops")),
	unique("announcements_content_unique").on(table.content),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const cupRounds = pgTable("cup_rounds", {
	id: serial().primaryKey().notNull(),
	cupGroupId: integer("cup_group_id").notNull(),
	order: smallint().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cupGroupId],
			foreignColumns: [cupGroups.id],
			name: "cup_rounds_cup_group_id_cup_groups_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);
