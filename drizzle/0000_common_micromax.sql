CREATE TYPE "public"."circuit_category" AS ENUM('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master');--> statement-breakpoint
CREATE TYPE "public"."circuit_place" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25');--> statement-breakpoint
CREATE TYPE "public"."circuit_type" AS ENUM('default', 'categories', 'school');--> statement-breakpoint
CREATE TYPE "public"."bracket_type" AS ENUM('UB', 'LB', 'GF');--> statement-breakpoint
CREATE TYPE "public"."phase_type" AS ENUM('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior');--> statement-breakpoint
CREATE TYPE "public"."event_time_control" AS ENUM('standard', 'rapid', 'blitz');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('open', 'closed', 'school');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('city', 'state', 'country');--> statement-breakpoint
CREATE TYPE "public"."rating_type" AS ENUM('blitz', 'rapid', 'classic');--> statement-breakpoint
CREATE TYPE "public"."role_type" AS ENUM('management', 'referee', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."title_type" AS ENUM('internal', 'external');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" smallint NOT NULL,
	"number" varchar(3) NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "announcements_content_unique" UNIQUE("content")
);
--> statement-breakpoint
CREATE TABLE "championships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	CONSTRAINT "championships_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "circuit_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"circuit_id" integer NOT NULL,
	"club_id" integer,
	"tournament_id" integer NOT NULL,
	"order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circuit_podiums" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"club_id" integer,
	"circuit_phase_id" integer NOT NULL,
	"category" "circuit_category",
	"place" "circuit_place" NOT NULL,
	"points" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circuits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"type" "circuit_type" NOT NULL,
	CONSTRAINT "circuits_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"logo" text,
	CONSTRAINT "clubs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cup_brackets" (
	"id" serial PRIMARY KEY NOT NULL,
	"cup_id" integer NOT NULL,
	"bracket_type" "bracket_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cup_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"winner_id" integer,
	"cup_match_id" integer NOT NULL,
	"game_number" smallint NOT NULL,
	"link" text
);
--> statement-breakpoint
CREATE TABLE "cup_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"cup_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cup_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_one_id" integer NOT NULL,
	"player_two_id" integer NOT NULL,
	"winner_id" integer,
	"cup_round_id" integer,
	"cup_playoff_id" integer,
	"best_of" smallint NOT NULL,
	"order" smallint NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cup_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"cup_group_id" integer NOT NULL,
	"nickname" varchar(40),
	"position" smallint,
	CONSTRAINT "cup_players_nickname_unique" UNIQUE("nickname")
);
--> statement-breakpoint
CREATE TABLE "cup_playoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cup_bracket_id" integer NOT NULL,
	"phase_type" "phase_type" NOT NULL,
	"order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cup_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"cup_group_id" integer NOT NULL,
	"order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"image_url" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"prize_pool" integer NOT NULL,
	"rhythm" varchar(20) NOT NULL,
	"championship_id" integer,
	CONSTRAINT "cups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "defending_champions" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"championship_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"chess_results" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"regulation" text,
	"form" text,
	"type" "event_type" NOT NULL,
	"time_control" "event_time_control" NOT NULL,
	CONSTRAINT "events_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "insignias" (
	"id" serial PRIMARY KEY NOT NULL,
	"insignia" varchar(80) NOT NULL,
	"level" smallint NOT NULL,
	CONSTRAINT "insignias_insignia_unique" UNIQUE("insignia")
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"href" text NOT NULL,
	"label" varchar(50) NOT NULL,
	"icon" text NOT NULL,
	"order" smallint NOT NULL,
	"link_group_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"type" "location_type" NOT NULL,
	"flag" text,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "norms" (
	"id" serial PRIMARY KEY NOT NULL,
	"norm" varchar(80) NOT NULL,
	CONSTRAINT "norms_norm_unique" UNIQUE("norm")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"nickname" varchar(20),
	"blitz" smallint DEFAULT 1900 NOT NULL,
	"rapid" smallint DEFAULT 1900 NOT NULL,
	"classic" smallint DEFAULT 1900 NOT NULL,
	"active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"description" text,
	"image_url" text,
	"cbx_id" integer,
	"fide_id" integer,
	"verified" boolean DEFAULT false,
	"birth" date,
	"sex" boolean DEFAULT false NOT NULL,
	"club_id" integer,
	"location_id" integer,
	CONSTRAINT "players_nickname_unique" UNIQUE("nickname")
);
--> statement-breakpoint
CREATE TABLE "players_to_insignias" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"insignia_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players_to_norms" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"norm_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players_to_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"role_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players_to_titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"title_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players_to_tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"rating_type" "rating_type" NOT NULL,
	"old_rating" smallint NOT NULL,
	"variation" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(80) NOT NULL,
	"image" text NOT NULL,
	"content" text NOT NULL,
	"slug" text NOT NULL,
	"published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(80) NOT NULL,
	"short_role" varchar(4) NOT NULL,
	"type" "role_type" NOT NULL,
	CONSTRAINT "roles_role_unique" UNIQUE("role"),
	CONSTRAINT "roles_short_role_unique" UNIQUE("short_role")
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(40) NOT NULL,
	"short_title" varchar(4) NOT NULL,
	"type" "title_type" NOT NULL,
	CONSTRAINT "titles_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "tournament_podiums" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"place" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"chess_results" text,
	"date" date,
	"championship_id" integer,
	CONSTRAINT "tournaments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "circuit_phases" ADD CONSTRAINT "circuit_phases_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_phases" ADD CONSTRAINT "circuit_phases_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_phases" ADD CONSTRAINT "circuit_phases_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_podiums" ADD CONSTRAINT "circuit_podiums_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_podiums" ADD CONSTRAINT "circuit_podiums_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circuit_podiums" ADD CONSTRAINT "circuit_podiums_circuit_phase_id_circuit_phases_id_fk" FOREIGN KEY ("circuit_phase_id") REFERENCES "public"."circuit_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_brackets" ADD CONSTRAINT "cup_brackets_cup_id_cups_id_fk" FOREIGN KEY ("cup_id") REFERENCES "public"."cups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_games" ADD CONSTRAINT "cup_games_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_games" ADD CONSTRAINT "cup_games_cup_match_id_cup_matches_id_fk" FOREIGN KEY ("cup_match_id") REFERENCES "public"."cup_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_groups" ADD CONSTRAINT "cup_groups_cup_id_cups_id_fk" FOREIGN KEY ("cup_id") REFERENCES "public"."cups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_player_one_id_players_id_fk" FOREIGN KEY ("player_one_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_player_two_id_players_id_fk" FOREIGN KEY ("player_two_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_cup_round_id_cup_rounds_id_fk" FOREIGN KEY ("cup_round_id") REFERENCES "public"."cup_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_cup_playoff_id_cup_playoffs_id_fk" FOREIGN KEY ("cup_playoff_id") REFERENCES "public"."cup_playoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_players" ADD CONSTRAINT "cup_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_players" ADD CONSTRAINT "cup_players_cup_group_id_cup_groups_id_fk" FOREIGN KEY ("cup_group_id") REFERENCES "public"."cup_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_playoffs" ADD CONSTRAINT "cup_playoffs_cup_bracket_id_cup_brackets_id_fk" FOREIGN KEY ("cup_bracket_id") REFERENCES "public"."cup_brackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cup_rounds" ADD CONSTRAINT "cup_rounds_cup_group_id_cup_groups_id_fk" FOREIGN KEY ("cup_group_id") REFERENCES "public"."cup_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cups" ADD CONSTRAINT "cups_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defending_champions" ADD CONSTRAINT "defending_champions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defending_champions" ADD CONSTRAINT "defending_champions_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_link_group_id_link_groups_id_fk" FOREIGN KEY ("link_group_id") REFERENCES "public"."link_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_insignias" ADD CONSTRAINT "players_to_insignias_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_insignias" ADD CONSTRAINT "players_to_insignias_insignia_id_insignias_id_fk" FOREIGN KEY ("insignia_id") REFERENCES "public"."insignias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_norms" ADD CONSTRAINT "players_to_norms_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_norms" ADD CONSTRAINT "players_to_norms_norm_id_norms_id_fk" FOREIGN KEY ("norm_id") REFERENCES "public"."norms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_roles" ADD CONSTRAINT "players_to_roles_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_roles" ADD CONSTRAINT "players_to_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_titles" ADD CONSTRAINT "players_to_titles_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_titles" ADD CONSTRAINT "players_to_titles_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_tournaments" ADD CONSTRAINT "players_to_tournaments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_to_tournaments" ADD CONSTRAINT "players_to_tournaments_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_podiums" ADD CONSTRAINT "tournament_podiums_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_podiums" ADD CONSTRAINT "tournament_podiums_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "year_number" ON "announcements" USING btree ("year","number");--> statement-breakpoint
CREATE UNIQUE INDEX "defending_champion" ON "defending_champions" USING btree ("player_id","championship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_insignia" ON "players_to_insignias" USING btree ("player_id","insignia_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_norm" ON "players_to_norms" USING btree ("player_id","norm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_role" ON "players_to_roles" USING btree ("player_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_title" ON "players_to_titles" USING btree ("player_id","title_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament" ON "players_to_tournaments" USING btree ("player_id","tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament_podium" ON "tournament_podiums" USING btree ("player_id","tournament_id");