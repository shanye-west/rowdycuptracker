// client/src/shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm"; // Make sure sql is imported
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  captain: text("captain").notNull(),
  color: text("color").notNull(),
  logo: text("logo"),
});

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  handicap: decimal("handicap", { precision: 4, scale: 1 }),
  photo: text("photo"),
});

// Profiles table (replaces the old 'users' table for public profile data)
export const profiles = pgTable("profiles", {
  // This ID MUST match the id from Supabase's auth.users table (which is a UUID)
  // It also serves as the primary key for this table.
  // The FOREIGN KEY to auth.users(id) will be set up manually in Supabase SQL or via a trigger.
  // Drizzle cannot directly reference auth.users without defining it, which we don't want to manage.
  id: uuid("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  role: text("role").notNull().default("player"), // "player" or "admin"
  playerId: integer("player_id").references(() => players.id), // Link to player record in your app's 'players' table
  email: text("email"), // Stores the dummy email, e.g., username@rowdycup.app
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  par: integer("par").notNull().default(72),
  yardage: integer("yardage"),
  description: text("description"),
  rating: decimal("rating", { precision: 4, scale: 1 }),
  slope: integer("slope"),
});

// Course Holes table
export const courseHoles = pgTable("course_holes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  holeNumber: integer("hole_number").notNull(),
  par: integer("par").notNull(),
  yardage: integer("yardage"),
  handicapRank: integer("handicap_rank").notNull(),
});

// Rounds table
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  // tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(), // Add this if rounds belong to a specific tournament
  number: integer("number").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  format: text("format").notNull(),
  date: timestamp("date"),
  teeTime: text("tee_time"),
  status: text("status").default("upcoming"),
  isLocked: boolean("is_locked").default(false).notNull(),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").references(() => rounds.id).notNull(),
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
  status: text("status").default("upcoming"),
  currentHole: integer("current_hole").default(1),
  team1Score: integer("team1_score").default(0),
  team2Score: integer("team2_score").default(0),
  team1Status: text("team1_status"),
  team2Status: text("team2_status"),
  points: decimal("points", { precision: 3, scale: 1 }).default("1.0"),
  winnerId: integer("winner_id").references(() => teams.id),
  isLocked: boolean("is_locked").default(false).notNull(),
});

// Match Players table
export const matchPlayers = pgTable("match_players", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
});

// Hole Scores table
export const holeScores = pgTable("hole_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  hole: integer("hole").notNull(),
  strokes: integer("strokes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament standings/totals table
export const tournamentStandings = pgTable("tournament_standings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).unique().notNull(),
  round1Points: decimal("round1_points", { precision: 4, scale: 1 }).default("0"),
  round2Points: decimal("round2_points", { precision: 4, scale: 1 }).default("0"),
  round3Points: decimal("round3_points", { precision: 4, scale: 1 }).default("0"),
  round4Points: decimal("round4_points", { precision: 4, scale: 1 }).default("0"),
  totalPoints: decimal("total_points", { precision: 4, scale: 1 }).default("0"),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  status: text("status").default("upcoming"),
  isActive: boolean("is_active").default(false).notNull(),
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
  matchType: text("match_type").notNull(),
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
  profile: one(profiles, { // A player is linked from a profile
    fields: [players.id],
    references: [profiles.playerId],
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

// Renamed from usersRelations to profilesRelations
export const profilesRelations = relations(profiles, ({ one }) => ({
  player: one(players, { // A profile can be linked to one player record
    fields: [profiles.playerId],
    references: [players.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  rounds: many(rounds),
  courseHoles: many(courseHoles),
}));

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
  // tournament: one(tournaments, { // If you add tournamentId to rounds
  //   fields: [rounds.tournamentId],
  //   references: [tournaments.id],
  // }),
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
    relationName: "winnerTeam"
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
  rounds: many(rounds),
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
export const insertProfileSchema = createInsertSchema(profiles); // `id` will be the Supabase auth.uid()
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertCourseHoleSchema = createInsertSchema(courseHoles).omit({ id: true });
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

// Types
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Profile = typeof profiles.$inferSelect; // Renamed from User
export type Course = typeof courses.$inferSelect;
export type CourseHole = typeof courseHoles.$inferSelect;
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
export type InsertProfile = z.infer<typeof insertProfileSchema>; // Renamed from InsertUser
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseHole = z.infer<typeof insertCourseHoleSchema>;
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
  courseHoles: CourseHole[]; // Renamed from 'holes' for clarity with table name
};

export type RoundWithCourseDetails = Round & {
  course: CourseWithHoles | null;
  // tournament?: Tournament | null; // If you add tournamentId to rounds
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

export type TeamWithStandings = Team & {
  standings: TournamentStanding | null;
  players: Player[];
};

// AppUser type which will be used in client-side auth context
// This maps to the data we expect from our public 'profiles' table joined with Supabase auth info
export type AppUser = Profile; // Simply alias Profile for use in auth.tsx