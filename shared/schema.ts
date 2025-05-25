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
  handicap: decimal("handicap", { precision: 4, scale: 1 }), // This is the Handicap Index
  photo: text("photo"), // photo URL
});

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("player"), // "player" or "admin"
  playerId: integer("player_id").references(() => players.id), // Link to player record if applicable
  email: text("email"), // Can be dummmy like username@rowdycup.com
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Overall course par, can be derived from courseHoles or kept for quick reference
  par: integer("par").notNull().default(72),
  yardage: integer("yardage"), // Overall yardage, can be derived or kept
  description: text("description"),
  rating: decimal("rating", { precision: 4, scale: 1 }), // e.g., 72.1
  slope: integer("slope"), // e.g., 130
});

// Course Holes table (New Table)
export const courseHoles = pgTable("course_holes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  holeNumber: integer("hole_number").notNull(), // 1-18
  par: integer("par").notNull(),
  yardage: integer("yardage"),
  handicapRank: integer("handicap_rank").notNull(), // Difficulty ranking 1-18
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
  isLocked: boolean("is_locked").default(false).notNull(),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").references(() => rounds.id).notNull(),
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
  status: text("status").default("upcoming"), // "upcoming", "live", "completed"
  currentHole: integer("current_hole").default(1),
  team1Score: integer("team1_score").default(0), // For match play status, e.g., holes won
  team2Score: integer("team2_score").default(0), // For match play status, e.g., holes won
  team1Status: text("team1_status"), // match play status like "2 UP", "AS", etc.
  team2Status: text("team2_status"),
  points: decimal("points", { precision: 3, scale: 1 }).default("1.0"), // points available for this match
  winnerId: integer("winner_id").references(() => teams.id),
  isLocked: boolean("is_locked").default(false).notNull(),
});

// Match Players (for pairing players in matches)
export const matchPlayers = pgTable("match_players", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(), // Team player is representing in this match
});

// Hole Scores table (individual hole scoring for formats that need it, like Best Ball)
// For Scramble/Shamble, this might store the single team score under one player ID.
export const holeScores = pgTable("hole_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(), // The player who made this score
  hole: integer("hole").notNull(), // Hole number 1-18
  strokes: integer("strokes"), // Gross score for this player on this hole
  // Par for this hole will be looked up from courseHoles table. Consider removing `par` field here.
  // par: integer("par").notNull().default(4), 
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament standings/totals
export const tournamentStandings = pgTable("tournament_standings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).unique().notNull(), // Ensure one standing per team
  round1Points: decimal("round1_points", { precision: 4, scale: 1 }).default("0"),
  round2Points: decimal("round2_points", { precision: 4, scale: 1 }).default("0"),
  round3Points: decimal("round3_points", { precision: 4, scale: 1 }).default("0"),
  round4Points: decimal("round4_points", { precision: 4, scale: 1 }).default("0"),
  totalPoints: decimal("total_points", { precision: 4, scale: 1 }).default("0"),
});

// Tournaments table (Master list of all tournaments, past and present)
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: text("status").default("upcoming"), // upcoming, active, completed
  isActive: boolean("is_active").default(false).notNull(), // Flag for current tournament
});

// Player Statistics Tables
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
  playerId: integer("player_id").references(() => players.id).unique().notNull(),
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
  standings: one(tournamentStandings, {
    fields: [teams.id],
    references: [tournamentStandings.teamId]
  }),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  matchPlayers: many(matchPlayers),
  holeScores: many(holeScores),
  user: one(users, { // A player might have one user account
    fields: [players.id],
    references: [users.playerId],
  }),
  playerTournamentStats: many(playerTournamentStats),
  playerHistoricalStats: one(playerHistoricalStats, {
     fields: [players.id],
     references: [playerHistoricalStats.playerId]
  }),
  playerMatchTypeStats: many(playerMatchTypeStats),
  player1HeadToHeadStats: many(playerHeadToHeadStats, { relationName: "player1"}),
  player2HeadToHeadStats: many(playerHeadToHeadStats, { relationName: "player2"}),
}));

export const usersRelations = relations(users, ({ one }) => ({
  player: one(players, { // A user might be linked to one player record
    fields: [users.playerId],
    references: [players.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  rounds: many(rounds),
  courseHoles: many(courseHoles), // Add relation to courseHoles
}));

// Add relation from courseHoles to courses
export const courseHolesRelations = relations(courseHoles, ({ one }) => ({
  course: one(courses, {
    fields: [courseHoles.courseId],
    references: [courses.id],
  }),
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
    relationName: "winnerTeam" // Changed relation name to avoid conflict if players can also be winners
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
  team: one(teams, { // The team the player is representing in THIS match
    fields: [matchPlayers.teamId],
    references: [teams.id],
  }),
}));

export const holeScoresRelations = relations(holeScores, ({ one }) => ({
  match: one(matches, {
    fields: [holeScores.matchId],
    references: [matches.id],
  }),
  player: one(players, { // The player who achieved this score
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
  rounds: many(rounds), // A tournament can have many rounds
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
export const insertCourseHoleSchema = createInsertSchema(courseHoles).omit({ id: true }); // New
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
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseHole = typeof courseHoles.$inferSelect; // New
export type Round = typeof rounds.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type HoleScore = typeof holeScores.$inferSelect;
export type TournamentStanding = typeof tournamentStandings.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type PlayerTournamentStats = typeof playerTournamentStats.$inferSelect;
export type PlayerHistoricalStats = typeof playerHistoricalStats.$inferSelect;
export type PlayerMatchTypeStats = typeof playerMatchTypeStats.$inferSelect;
export type PlayerHeadToHeadStats = typeof playerHeadToHeadStats.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseHole = z.infer<typeof insertCourseHoleSchema>; // New
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMatchPlayer = z.infer<typeof insertMatchPlayerSchema>;
export type InsertHoleScore = z.infer<typeof insertHoleScoreSchema>;
export type InsertTournamentStanding = z.infer<typeof insertTournamentStandingSchema>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type InsertPlayerTournamentStats = z.infer<typeof insertPlayerTournamentStatsSchema>;
export type InsertPlayerHistoricalStats = z.infer<typeof insertPlayerHistoricalStatsSchema>;
export type InsertPlayerMatchTypeStats = z.infer<typeof insertPlayerMatchTypeStatsSchema>;
export type InsertPlayerHeadToHeadStats = z.infer<typeof insertPlayerHeadToHeadStatsSchema>;


// Additional types for complex queries
export type CourseWithHoles = Course & {
  holes: CourseHole[];
};

export type RoundWithCourseDetails = Round & {
  course: CourseWithHoles | null; // Course can be null if not assigned yet
};

export type MatchWithDetails = Match & {
  round: RoundWithCourseDetails;
  team1: Team;
  team2: Team;
  matchPlayers: (MatchPlayer & { player: Player })[];
  holeScores: HoleScore[];
};

export type TeamWithPlayersAndStandings = Team & {
  players: Player[];
  standings: TournamentStanding | null;
};

// Updated to reflect a more comprehensive team object often needed.
export type TeamWithStandings = Team & {
  standings: TournamentStanding | null;
  players: Player[]; // Keeping this for consistency with existing use, but TeamWithPlayersAndStandings is more descriptive
};