import { relations } from "drizzle-orm/relations";
import { cupMatches, cupGames, players, cups, cupGroups, cupPlayers, championships, defendingChampions, clubs, locations, tournaments, circuits, circuitPhases, circuitPodiums, cupPlayoffs, cupRounds, cupBrackets, linkGroups, links, norms, playersToNorms, playersToRoles, roles, playersToTitles, titles, playersToTournaments, profiles, posts, tournamentPodiums, insignias, playersToInsignias, user, account, session } from "./schema";

export const cupGamesRelations = relations(cupGames, ({one}) => ({
	cupMatch: one(cupMatches, {
		fields: [cupGames.cupMatchId],
		references: [cupMatches.id]
	}),
	player: one(players, {
		fields: [cupGames.winnerId],
		references: [players.id]
	}),
}));

export const cupMatchesRelations = relations(cupMatches, ({one, many}) => ({
	cupGames: many(cupGames),
	cupPlayoff: one(cupPlayoffs, {
		fields: [cupMatches.cupPlayoffId],
		references: [cupPlayoffs.id]
	}),
	cupRound: one(cupRounds, {
		fields: [cupMatches.cupRoundId],
		references: [cupRounds.id]
	}),
	player_playerOneId: one(players, {
		fields: [cupMatches.playerOneId],
		references: [players.id],
		relationName: "cupMatches_playerOneId_players_id"
	}),
	player_playerTwoId: one(players, {
		fields: [cupMatches.playerTwoId],
		references: [players.id],
		relationName: "cupMatches_playerTwoId_players_id"
	}),
	player_winnerId: one(players, {
		fields: [cupMatches.winnerId],
		references: [players.id],
		relationName: "cupMatches_winnerId_players_id"
	}),
}));

export const playersRelations = relations(players, ({one, many}) => ({
	cupGames: many(cupGames),
	cupPlayers: many(cupPlayers),
	defendingChampions: many(defendingChampions),
	club: one(clubs, {
		fields: [players.clubId],
		references: [clubs.id]
	}),
	location: one(locations, {
		fields: [players.locationId],
		references: [locations.id]
	}),
	circuitPodiums: many(circuitPodiums),
	cupMatches_playerOneId: many(cupMatches, {
		relationName: "cupMatches_playerOneId_players_id"
	}),
	cupMatches_playerTwoId: many(cupMatches, {
		relationName: "cupMatches_playerTwoId_players_id"
	}),
	cupMatches_winnerId: many(cupMatches, {
		relationName: "cupMatches_winnerId_players_id"
	}),
	playersToNorms: many(playersToNorms),
	playersToRoles: many(playersToRoles),
	playersToTitles: many(playersToTitles),
	playersToTournaments: many(playersToTournaments),
	tournamentPodiums: many(tournamentPodiums),
	playersToInsignias: many(playersToInsignias),
}));

export const cupGroupsRelations = relations(cupGroups, ({one, many}) => ({
	cup: one(cups, {
		fields: [cupGroups.cupId],
		references: [cups.id]
	}),
	cupPlayers: many(cupPlayers),
	cupRounds: many(cupRounds),
}));

export const cupsRelations = relations(cups, ({one, many}) => ({
	cupGroups: many(cupGroups),
	championship: one(championships, {
		fields: [cups.championshipId],
		references: [championships.id]
	}),
	cupBrackets: many(cupBrackets),
}));

export const cupPlayersRelations = relations(cupPlayers, ({one}) => ({
	cupGroup: one(cupGroups, {
		fields: [cupPlayers.cupGroupId],
		references: [cupGroups.id]
	}),
	player: one(players, {
		fields: [cupPlayers.playerId],
		references: [players.id]
	}),
}));

export const championshipsRelations = relations(championships, ({many}) => ({
	cups: many(cups),
	defendingChampions: many(defendingChampions),
	tournaments: many(tournaments),
}));

export const defendingChampionsRelations = relations(defendingChampions, ({one}) => ({
	championship: one(championships, {
		fields: [defendingChampions.championshipId],
		references: [championships.id]
	}),
	player: one(players, {
		fields: [defendingChampions.playerId],
		references: [players.id]
	}),
}));

export const clubsRelations = relations(clubs, ({many}) => ({
	players: many(players),
	circuitPhases: many(circuitPhases),
	circuitPodiums: many(circuitPodiums),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	players: many(players),
}));

export const tournamentsRelations = relations(tournaments, ({one, many}) => ({
	championship: one(championships, {
		fields: [tournaments.championshipId],
		references: [championships.id]
	}),
	circuitPhases: many(circuitPhases),
	playersToTournaments: many(playersToTournaments),
	tournamentPodiums: many(tournamentPodiums),
}));

export const circuitPhasesRelations = relations(circuitPhases, ({one, many}) => ({
	circuit: one(circuits, {
		fields: [circuitPhases.circuitId],
		references: [circuits.id]
	}),
	club: one(clubs, {
		fields: [circuitPhases.clubId],
		references: [clubs.id]
	}),
	tournament: one(tournaments, {
		fields: [circuitPhases.tournamentId],
		references: [tournaments.id]
	}),
	circuitPodiums: many(circuitPodiums),
}));

export const circuitsRelations = relations(circuits, ({many}) => ({
	circuitPhases: many(circuitPhases),
}));

export const circuitPodiumsRelations = relations(circuitPodiums, ({one}) => ({
	circuitPhase: one(circuitPhases, {
		fields: [circuitPodiums.circuitPhaseId],
		references: [circuitPhases.id]
	}),
	club: one(clubs, {
		fields: [circuitPodiums.clubId],
		references: [clubs.id]
	}),
	player: one(players, {
		fields: [circuitPodiums.playerId],
		references: [players.id]
	}),
}));

export const cupPlayoffsRelations = relations(cupPlayoffs, ({one, many}) => ({
	cupMatches: many(cupMatches),
	cupBracket: one(cupBrackets, {
		fields: [cupPlayoffs.cupBracketId],
		references: [cupBrackets.id]
	}),
}));

export const cupRoundsRelations = relations(cupRounds, ({one, many}) => ({
	cupMatches: many(cupMatches),
	cupGroup: one(cupGroups, {
		fields: [cupRounds.cupGroupId],
		references: [cupGroups.id]
	}),
}));

export const cupBracketsRelations = relations(cupBrackets, ({one, many}) => ({
	cupPlayoffs: many(cupPlayoffs),
	cup: one(cups, {
		fields: [cupBrackets.cupId],
		references: [cups.id]
	}),
}));

export const linksRelations = relations(links, ({one}) => ({
	linkGroup: one(linkGroups, {
		fields: [links.linkGroupId],
		references: [linkGroups.id]
	}),
}));

export const linkGroupsRelations = relations(linkGroups, ({many}) => ({
	links: many(links),
}));

export const playersToNormsRelations = relations(playersToNorms, ({one}) => ({
	norm: one(norms, {
		fields: [playersToNorms.normId],
		references: [norms.id]
	}),
	player: one(players, {
		fields: [playersToNorms.playerId],
		references: [players.id]
	}),
}));

export const normsRelations = relations(norms, ({many}) => ({
	playersToNorms: many(playersToNorms),
}));

export const playersToRolesRelations = relations(playersToRoles, ({one}) => ({
	player: one(players, {
		fields: [playersToRoles.playerId],
		references: [players.id]
	}),
	role: one(roles, {
		fields: [playersToRoles.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	playersToRoles: many(playersToRoles),
}));

export const playersToTitlesRelations = relations(playersToTitles, ({one}) => ({
	player: one(players, {
		fields: [playersToTitles.playerId],
		references: [players.id]
	}),
	title: one(titles, {
		fields: [playersToTitles.titleId],
		references: [titles.id]
	}),
}));

export const titlesRelations = relations(titles, ({many}) => ({
	playersToTitles: many(playersToTitles),
}));

export const playersToTournamentsRelations = relations(playersToTournaments, ({one}) => ({
	player: one(players, {
		fields: [playersToTournaments.playerId],
		references: [players.id]
	}),
	tournament: one(tournaments, {
		fields: [playersToTournaments.tournamentId],
		references: [tournaments.id]
	}),
}));

export const postsRelations = relations(posts, ({one}) => ({
	profile: one(profiles, {
		fields: [posts.authorId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	posts: many(posts),
}));

export const tournamentPodiumsRelations = relations(tournamentPodiums, ({one}) => ({
	player: one(players, {
		fields: [tournamentPodiums.playerId],
		references: [players.id]
	}),
	tournament: one(tournaments, {
		fields: [tournamentPodiums.tournamentId],
		references: [tournaments.id]
	}),
}));

export const playersToInsigniasRelations = relations(playersToInsignias, ({one}) => ({
	insignia: one(insignias, {
		fields: [playersToInsignias.insigniaId],
		references: [insignias.id]
	}),
	player: one(players, {
		fields: [playersToInsignias.playerId],
		references: [players.id]
	}),
}));

export const insigniasRelations = relations(insignias, ({many}) => ({
	playersToInsignias: many(playersToInsignias),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));