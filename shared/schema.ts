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

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("player"), // "player" or "admin"
  playerId: integer("player_id").references(() => players.id), // Link to player record if applicable
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Player Statistics Tables
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: text("status").default("upcoming"), // upcoming, active, completed
});

export const playerTournamentStats = pgTable("player_tournament_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  ties: integer("ties").default(0),
  matchesPlayed: integer("matches_played").default(0),
});

export const playerHistoricalStats = pgTable("player_historical_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  totalWins: integer("total_wins").default(0),
  totalLosses: integer("total_losses").default(0),
  totalTies: integer("total_ties").default(0),
  totalMatches: integer("total_matches").default(0),
  tournamentsPlayed: integer("tournaments_played").default(0),
});

export const playerMatchTypeStats = pgTable("player_match_type_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  matchType: text("match_type").notNull(), // "2-man Scramble", "2-man Best Ball", etc.
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  ties: integer("ties").default(0),
  matchesPlayed: integer("matches_played").default(0),
});

export const playerHeadToHeadStats = pgTable("player_head_to_head_stats", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").references(() => players.id).notNull(),
  player2Id: integer("player2_id").references(() => players.id).notNull(),
  player1Wins: integer("player1_wins").default(0),
  player1Losses: integer("player1_losses").default(0),
  ties: integer("ties").default(0),
  matchesPlayed: integer("matches_played").default(0),
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
  user: one(users, {
    fields: [players.id],
    references: [users.playerId],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  player: one(players, {
    fields: [users.playerId],
    references: [players.id],
  }),
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

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  playerTournamentStats: many(playerTournamentStats),
}));

export const playerTournamentStatsRelations = relations(playerTournamentStats, ({ one }) => ({
  player: one(players, {
    fields: [playerTournamentStats.playerId],
    references: [players.id],
  }),
  tournament: one(tournaments, {
    fields: [playerTournamentStats.tournamentId],
    references: [tournaments.id],
  }),
}));

export const playerHistoricalStatsRelations = relations(playerHistoricalStats, ({ one }) => ({
  player: one(players, {
    fields: [playerHistoricalStats.playerId],
    references: [players.id],
  }),
}));

export const playerMatchTypeStatsRelations = relations(playerMatchTypeStats, ({ one }) => ({
  player: one(players, {
    fields: [playerMatchTypeStats.playerId],
    references: [players.id],
  }),
}));

export const playerHeadToHeadStatsRelations = relations(playerHeadToHeadStats, ({ one }) => ({
  player1: one(players, {
    fields: [playerHeadToHeadStats.player1Id],
    references: [players.id],
    relationName: "player1",
  }),
  player2: one(players, {
    fields: [playerHeadToHeadStats.player2Id],
    references: [players.id],
    relationName: "player2",
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
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true });
export const insertPlayerTournamentStatsSchema = createInsertSchema(playerTournamentStats).omit({ id: true });
export const insertPlayerHistoricalStatsSchema = createInsertSchema(playerHistoricalStats).omit({ id: true });
export const insertPlayerMatchTypeStatsSchema = createInsertSchema(playerMatchTypeStats).omit({ id: true });
export const insertPlayerHeadToHeadStatsSchema = createInsertSchema(playerHeadToHeadStats).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Types
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type HoleScore = typeof holeScores.$inferSelect;
export type TournamentStanding = typeof tournamentStandings.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMatchPlayer = z.infer<typeof insertMatchPlayerSchema>;
export type InsertHoleScore = z.infer<typeof insertHoleScoreSchema>;
export type InsertTournamentStanding = z.infer<typeof insertTournamentStandingSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type PlayerTournamentStats = typeof playerTournamentStats.$inferSelect;
export type PlayerHistoricalStats = typeof playerHistoricalStats.$inferSelect;
export type PlayerMatchTypeStats = typeof playerMatchTypeStats.$inferSelect;
export type PlayerHeadToHeadStats = typeof playerHeadToHeadStats.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
