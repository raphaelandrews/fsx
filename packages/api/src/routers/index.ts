import { router } from "../index";
import { announcementsRouter } from "./announcements";
import { championsRouter } from "./champions";
import { circuitsRouter } from "./circuits";
import { clubsRouter } from "./clubs";
import { cupsRouter } from "./cups";
import { eventsRouter } from "./events";
import { insigniaRouter } from "./insignia";
import { linkGroupsRouter } from "./linkGroups";
import { locationsRouter } from "./locations";
import { normsRouter } from "./norms";
import { playersRouter } from "./players";
import { playersToInsigniasRouter } from "./players-to-insignias";
import { playersToRolesRouter } from "./players-to-roles";
import { playersToTitlesRouter } from "./players-to-titles";
import { playersTournamentRouter } from "./players-tournament";
import { postsRouter } from "./posts";
import { rolesRouter } from "./roles";
import { tvSergipeRouter } from "./tv-sergipe";
import { seedRouter } from "./seed";
import { swissManagerRouter } from "./swiss-manager";
import { titledPlayersRouter } from "./titled-players";
import { topPlayersRouter } from "./top-players";
import { tournamentsRouter } from "./tournaments";
import { tournamentPodiumsRouter } from "./tournament-podiums";
import { titlesRouter } from "./titles";

export const appRouter = router({
  announcements: announcementsRouter,
  champions: championsRouter,
  circuits: circuitsRouter,
  clubs: clubsRouter,
  cups: cupsRouter,
  events: eventsRouter,
  insignias: insigniaRouter,
  links: linkGroupsRouter,
  locations: locationsRouter,
  norms: normsRouter,
  players: playersRouter,
  playersToInsignias: playersToInsigniasRouter,
  playersToRoles: playersToRolesRouter,
  playersToTitles: playersToTitlesRouter,
  playersTournament: playersTournamentRouter,
  posts: postsRouter,
  roles: rolesRouter,
  tvSergipe: tvSergipeRouter,
  seed: seedRouter,
  swissManager: swissManagerRouter,
  titledPlayers: titledPlayersRouter,
  titles: titlesRouter,
  topPlayers: topPlayersRouter,
  tournaments: tournamentsRouter,
  tournamentPodiums: tournamentPodiumsRouter,
});

export type AppRouter = typeof appRouter;
