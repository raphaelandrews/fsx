CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
DROP INDEX "player_norm";--> statement-breakpoint
DROP INDEX "player_title";--> statement-breakpoint
DROP INDEX "player_tournament";--> statement-breakpoint
DROP INDEX "defending_champion";--> statement-breakpoint
DROP INDEX "year_number";--> statement-breakpoint
DROP INDEX "player_insignia";--> statement-breakpoint
DROP INDEX "player_role";--> statement-breakpoint
DROP INDEX "player_tournament_podium";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_norm" ON "players_to_norms" USING btree ("player_id","norm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_title" ON "players_to_titles" USING btree ("player_id","title_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament" ON "players_to_tournaments" USING btree ("player_id","tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "defending_champion" ON "defending_champions" USING btree ("player_id","championship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "year_number" ON "announcements" USING btree ("year","number");--> statement-breakpoint
CREATE UNIQUE INDEX "player_insignia" ON "players_to_insignia" USING btree ("player_id","insignia_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_role" ON "players_to_roles" USING btree ("player_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_tournament_podium" ON "tournament_podiums" USING btree ("player_id","tournament_id");--> statement-breakpoint
ALTER TABLE "public"."circuit_podiums" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."circuit_category";--> statement-breakpoint
CREATE TYPE "public"."circuit_category" AS ENUM('Sub 8 Masculino', 'Sub 10 Masculino', 'Sub 12 Masculino', 'Sub 14 Masculino', 'Sub 16 Masculino', 'Sub 18 Masculino', 'Sub 8 Feminino', 'Sub 10 Feminino', 'Sub 12 Feminino', 'Sub 14 Feminino', 'Sub 16 Feminino', 'Sub 18 Feminino', 'Futuro', 'Juvenil', 'Master');--> statement-breakpoint
ALTER TABLE "public"."circuit_podiums" ALTER COLUMN "category" SET DATA TYPE "public"."circuit_category" USING "category"::"public"."circuit_category";--> statement-breakpoint
ALTER TABLE "public"."circuit_podiums" ALTER COLUMN "place" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."circuit_place";--> statement-breakpoint
CREATE TYPE "public"."circuit_place" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25');--> statement-breakpoint
ALTER TABLE "public"."circuit_podiums" ALTER COLUMN "place" SET DATA TYPE "public"."circuit_place" USING "place"::"public"."circuit_place";--> statement-breakpoint
ALTER TABLE "public"."cup_playoffs" ALTER COLUMN "phase_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."phase_type";--> statement-breakpoint
CREATE TYPE "public"."phase_type" AS ENUM('Oitavas Chave Superior', 'Quartas Chave Superior', 'Semis Chave Superior', 'Final Chave Superior', 'Grande Final', 'Chave Inferior Round 1', 'Chave Inferior Round 2', 'Chave Inferior Round 3', 'Chave Inferior Round 4', 'Quartas Chave Inferior', 'Semis Chave Inferior', 'Final Chave Inferior');--> statement-breakpoint
ALTER TABLE "public"."cup_playoffs" ALTER COLUMN "phase_type" SET DATA TYPE "public"."phase_type" USING "phase_type"::"public"."phase_type";