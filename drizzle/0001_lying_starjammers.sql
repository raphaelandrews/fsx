CREATE TYPE "public"."event_time_control" AS ENUM('standard', 'rapid', 'blitz');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('open', 'closed', 'school');--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"chess_results" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"regulation" text NOT NULL,
	"address" varchar(120) NOT NULL,
	"form" text NOT NULL,
	"categories" text NOT NULL,
	"prize" text NOT NULL,
	"fee" integer NOT NULL,
	"type" "event_type" NOT NULL,
	"time_control" "event_time_control" NOT NULL,
	CONSTRAINT "events_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "championships" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "circuit_phases" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "circuit_podiums" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "circuits" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clubs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_brackets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_games" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_matches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_players" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_playoffs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cup_rounds" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "defending_champions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "insignias" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "link_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "locations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "norms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players_to_insignias" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players_to_norms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players_to_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players_to_titles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "players_to_tournaments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "titles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tournament_podiums" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tournaments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "defending_champion";--> statement-breakpoint
DROP INDEX "player_norm";--> statement-breakpoint
DROP INDEX "player_role";--> statement-breakpoint
DROP INDEX "player_title";--> statement-breakpoint
DROP INDEX "player_tournament";--> statement-breakpoint
DROP INDEX "player_tournament_podium";--> statement-breakpoint
DROP INDEX "player_insignia";--> statement-breakpoint
DROP INDEX "year_number";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "sex" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "defending_champion" ON "defending_champions" USING btree ("player_id","championship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_norm" ON "players_to_norms" USING btree ("player_id","norm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_role" ON "players_to_roles" USING btree ("player_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_title" ON "players_to_titles" USING btree ("player_id","title_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament" ON "players_to_tournaments" USING btree ("player_id","tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament_podium" ON "tournament_podiums" USING btree ("player_id","tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_insignia" ON "players_to_insignias" USING btree ("player_id","insignia_id");--> statement-breakpoint
CREATE UNIQUE INDEX "year_number" ON "announcements" USING btree ("year","number");--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "circuits" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "defending_champions" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "players" CASCADE;--> statement-breakpoint
DROP POLICY "Enable update for authenticated users only" ON "players" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users only" ON "players" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "tournaments" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "circuit_phases" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "championships" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "circuit_podiums" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "clubs" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "locations" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "links" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "roles" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "players_to_roles" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "players_to_titles" CASCADE;--> statement-breakpoint
DROP POLICY "Enable update for authenticated users only" ON "players_to_tournaments" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "players_to_tournaments" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users only" ON "players_to_tournaments" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "posts" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "titles" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "tournament_podiums" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "link_groups" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "announcements" CASCADE;