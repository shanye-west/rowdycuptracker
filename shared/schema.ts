import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  captain: text("captain").notNull(),
  color: text("color").notNull(), // hex color code
  logo: text("logo"), // logo URL or identifier
});

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  handicap: decimal("handicap", { precision: 4, scale: 1 }),
  photo: text("photo"), // photo URL
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  par: integer("par").notNull().default(72),
  yardage: integer("yardage"),
  description: text("description"),
});

// Rounds table
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  format: text("format").notNull(), // "2-man-scramble", "best-ball", "shamble", "4-man-scramble", "singles"
  date: timestamp("date"),
  teeTime: text("tee_time"),
  status: text("status").default("upcoming"), // "upcoming", "live", "completed"
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").references(() => rounds.id),
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
  status: text("status").default("upcoming"), // "upcoming", "live", "completed"
  currentHole: integer("current_hole").default(1),
  team1Score: integer("team1_score").default(0),
  team2Score: integer("team2_score").default(0),
  team1Status: text("team1_status"), // match play status like "2 UP", "AS", etc.
  team2Status: text("team2_status"),
  points: decimal("points", { precision: 3, scale: 1 }).default("1.0"), // points available for this match
  winnerId: integer("winner_id").references(() => teams.id),
});

// Match Players (for pairing players in matches)
export const matchPlayers = pgTable("match_players", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  playerId: integer("player_id").references(() => players.id),
  teamId: integer("team_id").references(() => teams.id),
});

// Hole Scores table (individual hole scoring)
export const holeScores = pgTable("hole_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  playerId: integer("player_id").references(() => players.id),
  hole: integer("hole").notNull(),
  strokes: integer("strokes"),
  par: integer("par").notNull().default(4),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament standings/totals
export const tournamentStandings = pgTable("tournament_standings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  round1Points: decimal("round1_points", { precision: 4, scale: 1 }).default("0"),
  round2Points: decimal("round2_points", { precision: 4, scale: 1 }).default("0"),
  round3Points: decimal("round3_points", { precision: 4, scale: 1 }).default("0"),
  round4Points: decimal("round4_points", { precision: 4, scale: 1 }).default("0"),
  totalPoints: decimal("total_points", { precision: 4, scale: 1 }).default("0"),
});

// Relations
export const teamsRelations = relations(teams, ({ many, one }) => ({
  players: many(players),
  team1Matches: many(matches, { relationName: "team1" }),
  team2Matches: many(matches, { relationName: "team2" }),
  standings: one(tournamentStandings),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  matchPlayers: many(matchPlayers),
  holeScores: many(holeScores),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  rounds: many(rounds),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  course: one(courses, {
    fields: [rounds.courseId],
    references: [courses.id],
  }),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  round: one(rounds, {
    fields: [matches.roundId],
    references: [rounds.id],
  }),
  team1: one(teams, {
    fields: [matches.team1Id],
    references: [teams.id],
    relationName: "team1",
  }),
  team2: one(teams, {
    fields: [matches.team2Id],
    references: [teams.id],
    relationName: "team2",
  }),
  winner: one(teams, {
    fields: [matches.winnerId],
    references: [teams.id],
  }),
  matchPlayers: many(matchPlayers),
  holeScores: many(holeScores),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchPlayers.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [matchPlayers.teamId],
    references: [teams.id],
  }),
}));

export const holeScoresRelations = relations(holeScores, ({ one }) => ({
  match: one(matches, {
    fields: [holeScores.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [holeScores.playerId],
    references: [players.id],
  }),
}));

export const tournamentStandingsRelations = relations(tournamentStandings, ({ one }) => ({
  team: one(teams, {
    fields: [tournamentStandings.teamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });
export const insertMatchPlayerSchema = createInsertSchema(matchPlayers).omit({ id: true });
export const insertHoleScoreSchema = createInsertSchema(holeScores).omit({ id: true });
export const insertTournamentStandingSchema = createInsertSchema(tournamentStandings).omit({ id: true });

// Types
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type HoleScore = typeof holeScores.$inferSelect;
export type TournamentStanding = typeof tournamentStandings.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMatchPlayer = z.infer<typeof insertMatchPlayerSchema>;
export type InsertHoleScore = z.infer<typeof insertHoleScoreSchema>;
export type InsertTournamentStanding = z.infer<typeof insertTournamentStandingSchema>;

// Additional types for complex queries
export type MatchWithDetails = Match & {
  round: Round & { course: Course };
  team1: Team;
  team2: Team;
  matchPlayers: (MatchPlayer & { player: Player })[];
  holeScores: HoleScore[];
};

export type TeamWithStandings = Team & {
  standings: TournamentStanding | null;
  players: Player[];
};
