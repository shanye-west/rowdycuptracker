CREATE TABLE "course_holes" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"hole_number" integer NOT NULL,
	"par" integer NOT NULL,
	"yardage" integer,
	"handicap_rank" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hole_scores" ALTER COLUMN "match_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hole_scores" ALTER COLUMN "player_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match_players" ALTER COLUMN "match_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match_players" ALTER COLUMN "player_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match_players" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "round_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_standings" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "rating" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "slope" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_holes" ADD CONSTRAINT "course_holes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hole_scores" DROP COLUMN "par";--> statement-breakpoint
ALTER TABLE "player_historical_stats" ADD CONSTRAINT "player_historical_stats_player_id_unique" UNIQUE("player_id");--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_team_id_unique" UNIQUE("team_id");