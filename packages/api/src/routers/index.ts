import { router } from "../index";
import { announcementsRouter } from "./announcements";
import { cacheRouter } from "./cache";
import { categoriesRouter } from "./categories";
import { championsRouter } from "./champions";
import { circuitsRouter } from "./circuits";
import { clubsRouter } from "./clubs";
import { cupsRouter } from "./cups";
import { deletionRouter } from "./deletion";
import { eventsRouter } from "./events";
import { historyRouter } from "./history";
import { imagesRouter } from "./images";
import { insigniasRouter } from "./insignias";
import { linkGroupsRouter } from "./link-groups";
import { locationsRouter } from "./locations";
import { normsRouter } from "./norms";
import { playerRequestsRouter } from "./player-requests";
import { playersRouter } from "./players";
import { playersToInsigniasRouter } from "./players-to-insignias";
import { playersToRolesRouter } from "./players-to-roles";
import { playersToTitlesRouter } from "./players-to-titles";
import { playersTournamentRouter } from "./players-tournament";
import { postsRouter } from "./posts";
import { recordsRouter } from "./records";
import { rolesRouter } from "./roles";
import { scoringSchemesRouter } from "./scoring-schemes";
import { tvSergipeRouter } from "./tv-sergipe";
import { statsRouter } from "./stats";
import { swissManagerRouter } from "./swiss-manager";
import { titledPlayersRouter } from "./titled-players";
import { topPlayersRouter } from "./top-players";
import { tournamentsRouter } from "./tournaments";
import { tournamentPodiumsRouter } from "./tournament-podiums";
import { titlesRouter } from "./titles";

export const appRouter = router({
  announcements: announcementsRouter,
  cache: cacheRouter,
  categories: categoriesRouter,
  champions: championsRouter,
  circuits: circuitsRouter,
  clubs: clubsRouter,
  cups: cupsRouter,
  deletion: deletionRouter,
  events: eventsRouter,
  history: historyRouter,
  images: imagesRouter,
  insignias: insigniasRouter,
  links: linkGroupsRouter,
  locations: locationsRouter,
  norms: normsRouter,
  playerRequests: playerRequestsRouter,
  players: playersRouter,
  playersToInsignias: playersToInsigniasRouter,
  playersToRoles: playersToRolesRouter,
  playersToTitles: playersToTitlesRouter,
  playersTournament: playersTournamentRouter,
  posts: postsRouter,
  records: recordsRouter,
  roles: rolesRouter,
  scoringSchemes: scoringSchemesRouter,
  tvSergipe: tvSergipeRouter,
  stats: statsRouter,
  swissManager: swissManagerRouter,
  titledPlayers: titledPlayersRouter,
  titles: titlesRouter,
  topPlayers: topPlayersRouter,
  tournaments: tournamentsRouter,
  tournamentPodiums: tournamentPodiumsRouter,
});

export type AppRouter = typeof appRouter;
