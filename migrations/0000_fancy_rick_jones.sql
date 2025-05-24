CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"par" integer DEFAULT 72 NOT NULL,
	"yardage" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "hole_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"player_id" integer,
	"hole" integer NOT NULL,
	"strokes" integer,
	"par" integer DEFAULT 4 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"player_id" integer,
	"team_id" integer
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer,
	"team1_id" integer,
	"team2_id" integer,
	"status" text DEFAULT 'upcoming',
	"current_hole" integer DEFAULT 1,
	"team1_score" integer DEFAULT 0,
	"team2_score" integer DEFAULT 0,
	"team1_status" text,
	"team2_status" text,
	"points" numeric(3, 1) DEFAULT '1.0',
	"winner_id" integer
);
--> statement-breakpoint
CREATE TABLE "player_head_to_head_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player1_id" integer NOT NULL,
	"player2_id" integer NOT NULL,
	"player1_wins" integer DEFAULT 0,
	"player1_losses" integer DEFAULT 0,
	"ties" integer DEFAULT 0,
	"matches_played" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "player_historical_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"total_wins" integer DEFAULT 0,
	"total_losses" integer DEFAULT 0,
	"total_ties" integer DEFAULT 0,
	"total_matches" integer DEFAULT 0,
	"tournaments_played" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "player_match_type_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"match_type" text NOT NULL,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"ties" integer DEFAULT 0,
	"matches_played" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "player_tournament_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"ties" integer DEFAULT 0,
	"matches_played" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" integer,
	"handicap" numeric(4, 1),
	"photo" text
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"course_id" integer,
	"format" text NOT NULL,
	"date" timestamp,
	"tee_time" text,
	"status" text DEFAULT 'upcoming'
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"captain" text NOT NULL,
	"color" text NOT NULL,
	"logo" text
);
--> statement-breakpoint
CREATE TABLE "tournament_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"round1_points" numeric(4, 1) DEFAULT '0',
	"round2_points" numeric(4, 1) DEFAULT '0',
	"round3_points" numeric(4, 1) DEFAULT '0',
	"round4_points" numeric(4, 1) DEFAULT '0',
	"total_points" numeric(4, 1) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"location" text,
	"status" text DEFAULT 'upcoming'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"player_id" integer,
	"email" text,
	"first_name" text,
	"last_name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_id_teams_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_id_teams_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_head_to_head_stats" ADD CONSTRAINT "player_head_to_head_stats_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_head_to_head_stats" ADD CONSTRAINT "player_head_to_head_stats_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_historical_stats" ADD CONSTRAINT "player_historical_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_type_stats" ADD CONSTRAINT "player_match_type_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;