import { relations } from "drizzle-orm/relations";
import { circuitPhases, circuitPodiums, clubs, players, cups, cupBrackets, cupGroups, cupPlayoffs, cupMatches, cupRounds, locations, norms, playersToNorms, playersToTitles, titles, playersToTournaments, tournaments, profiles, posts, championships, defendingChampions, cupPlayers, circuits, linksGroups, links, cupGames, insignia, playersToInsignia, playersToRoles, roles, tournamentPodiums } from "./schema";

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

export const circuitPhasesRelations = relations(circuitPhases, ({one, many}) => ({
	circuitPodiums: many(circuitPodiums),
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
}));

export const clubsRelations = relations(clubs, ({many}) => ({
	circuitPodiums: many(circuitPodiums),
	players: many(players),
	circuitPhases: many(circuitPhases),
}));

export const playersRelations = relations(players, ({one, many}) => ({
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
	club: one(clubs, {
		fields: [players.clubId],
		references: [clubs.id]
	}),
	location: one(locations, {
		fields: [players.locationId],
		references: [locations.id]
	}),
	playersToNorms: many(playersToNorms),
	playersToTitles: many(playersToTitles),
	playersToTournaments: many(playersToTournaments),
	defendingChampions: many(defendingChampions),
	cupPlayers: many(cupPlayers),
	cupGames: many(cupGames),
	playersToInsignias: many(playersToInsignia),
	playersToRoles: many(playersToRoles),
	tournamentPodiums: many(tournamentPodiums),
}));

export const cupBracketsRelations = relations(cupBrackets, ({one, many}) => ({
	cup: one(cups, {
		fields: [cupBrackets.cupId],
		references: [cups.id]
	}),
	cupPlayoffs: many(cupPlayoffs),
}));

export const cupsRelations = relations(cups, ({one, many}) => ({
	cupBrackets: many(cupBrackets),
	cupGroups: many(cupGroups),
	championship: one(championships, {
		fields: [cups.championshipId],
		references: [championships.id]
	}),
}));

export const cupGroupsRelations = relations(cupGroups, ({one, many}) => ({
	cup: one(cups, {
		fields: [cupGroups.cupId],
		references: [cups.id]
	}),
	cupPlayers: many(cupPlayers),
	cupRounds: many(cupRounds),
}));

export const cupMatchesRelations = relations(cupMatches, ({one, many}) => ({
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
	cupGames: many(cupGames),
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

export const locationsRelations = relations(locations, ({many}) => ({
	players: many(players),
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

export const tournamentsRelations = relations(tournaments, ({one, many}) => ({
	playersToTournaments: many(playersToTournaments),
	championship: one(championships, {
		fields: [tournaments.championshipId],
		references: [championships.id]
	}),
	circuitPhases: many(circuitPhases),
	tournamentPodiums: many(tournamentPodiums),
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

export const championshipsRelations = relations(championships, ({many}) => ({
	defendingChampions: many(defendingChampions),
	tournaments: many(tournaments),
	cups: many(cups),
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

export const circuitsRelations = relations(circuits, ({many}) => ({
	circuitPhases: many(circuitPhases),
}));

export const linksRelations = relations(links, ({one}) => ({
	linksGroup: one(linksGroups, {
		fields: [links.linkGroupId],
		references: [linksGroups.id]
	}),
}));

export const linksGroupsRelations = relations(linksGroups, ({many}) => ({
	links: many(links),
}));

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

export const playersToInsigniaRelations = relations(playersToInsignia, ({one}) => ({
	insignia: one(insignia, {
		fields: [playersToInsignia.insigniaId],
		references: [insignia.id]
	}),
	player: one(players, {
		fields: [playersToInsignia.playerId],
		references: [players.id]
	}),
}));

export const insigniaRelations = relations(insignia, ({many}) => ({
	playersToInsignias: many(playersToInsignia),
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