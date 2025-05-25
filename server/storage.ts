// server/storage.ts
import {
  teams, players, courses, rounds, matches, matchPlayers, holeScores, tournamentStandings, profiles, // Changed users to profiles
  courseHoles, tournaments,
  type Team, type Player, type Course, type Round, type Match, type MatchPlayer,
  type HoleScore, type TournamentStanding, type Profile, type CourseHole, // Changed User to Profile
  type InsertTeam, type InsertPlayer, type InsertCourse, type InsertRound, type InsertMatch, type InsertMatchPlayer,
  type InsertHoleScore, type InsertTournamentStanding, type InsertProfile, type InsertCourseHole, // Changed InsertUser to InsertProfile
  type InsertTournament, // <-- Add this line
  type MatchWithDetails, type TeamWithStandings, type CourseWithHoles,
  type RoundWithCourseDetails, type AppUser, type Tournament // AppUser is an alias for Profile in shared/schema
} from "@shared/schema";
import { db } from "./db"; // This db instance will eventually be unused if Express is fully phased out
import { eq, and, asc, desc } from "drizzle-orm";

// Define the IStorage interface based on current methods, will be refactored/removed later
export interface IStorage {
  getTeams(): Promise<TeamWithStandings[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getPlayers(): Promise<Player[]>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;

  // Profile methods (formerly User methods)
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  getProfileById(id: string): Promise<Profile | undefined>; // ID is now UUID (string)
  getProfilesAll(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>; // Note: Supabase trigger handles this mostly
  updateProfile(id: string, updates: Partial<Profile>): Promise<void>; // ID is now UUID (string)

  getCourses(): Promise<CourseWithHoles[]>;
  getCourse(id: number): Promise<CourseWithHoles | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  createCourseHole(courseHole: InsertCourseHole): Promise<CourseHole>;
  getCourseHoles(courseId: number): Promise<CourseHole[]>;
  getRounds(tournamentId?: number): Promise<RoundWithCourseDetails[]>;
  getRound(id: number): Promise<RoundWithCourseDetails | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRoundStatus(id: number, status: string): Promise<void>;
  updateRoundLock(id: number, isLocked: boolean): Promise<void>;
  deleteRound(id: number): Promise<void>;
  getMatches(roundId?: number): Promise<MatchWithDetails[]>;
  getMatch(id: number): Promise<MatchWithDetails | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number, team1Status?: string, team2Status?: string): Promise<void>;
  updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void>;
  updateMatchLock(id: number, isLocked: boolean): Promise<void>;
  addMatchPlayer(matchPlayer: InsertMatchPlayer): Promise<MatchPlayer>;
  getMatchPlayers(matchId: number): Promise<(MatchPlayer & { player: Player })[]>;
  updateHoleScore(holeScore: InsertHoleScore): Promise<HoleScore>;
  getHoleScores(matchId: number): Promise<HoleScore[]>;
  getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]>;
  updateTournamentStanding(teamId: number, roundPoints: Partial<TournamentStanding>): Promise<void>;
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getActiveTournament(): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournamentActive(id: number, isActive: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<TeamWithStandings[]> {
    // @ts-ignore
    return db.query.teams.findMany({
      with: {
        players: true,
        standings: true,
      },
      orderBy: [asc(teams.name)]
    }) as Promise<TeamWithStandings[]>;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    // @ts-ignore
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    // @ts-ignore
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  // Players
  async getPlayers(): Promise<Player[]> {
    // @ts-ignore
    return db.select().from(players).orderBy(asc(players.name));
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    // @ts-ignore
    return db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    // @ts-ignore
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  // Profiles (formerly Users)
  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    // @ts-ignore
    const [profile] = await db.select().from(profiles).where(eq(profiles.username, username));
    return profile || undefined;
  }

  async getProfileById(id: string): Promise<Profile | undefined> { // ID is UUID (string)
    // @ts-ignore
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async getProfilesAll(): Promise<Profile[]> {
    // @ts-ignore
    return db.select().from(profiles).orderBy(asc(profiles.username));
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    // This method is less likely to be used directly for user creation with Supabase Auth + trigger pattern
    // The trigger 'handle_new_user' in Supabase should create the profile.
    // This might be used by an admin panel if it needs to create a profile record separately,
    // but usually, profile creation is tied to auth user creation.
    // PasswordHash is not part of the 'profiles' table.
    // @ts-ignore
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> { // ID is UUID (string)
    // @ts-ignore
    await db.update(profiles).set(updates).where(eq(profiles.id, id));
  }

  // Courses
  async getCourses(): Promise<CourseWithHoles[]> {
    // @ts-ignore
    return db.query.courses.findMany({
      with: {
        courseHoles: true,
      },
      orderBy: [asc(courses.name)]
    }) as Promise<CourseWithHoles[]>;
  }

  async getCourse(id: number): Promise<CourseWithHoles | undefined> {
    // @ts-ignore
    return db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        courseHoles: true,
      },
    }) as Promise<CourseWithHoles | undefined>;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    // @ts-ignore
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async createCourseHole(insertCourseHole: InsertCourseHole): Promise<CourseHole> {
    // @ts-ignore
    const [hole] = await db.insert(courseHoles).values(insertCourseHole).returning();
    return hole;
  }
  async getCourseHoles(courseIdInput: number): Promise<CourseHole[]> {
    // @ts-ignore
    return db.select().from(courseHoles).where(eq(courseHoles.courseId, courseIdInput)).orderBy(asc(courseHoles.holeNumber));
  }

  // Rounds
  async getRounds(tournamentId?: number): Promise<RoundWithCourseDetails[]> {
    // @ts-ignore
    const query = db.query.rounds.findMany({
      with: {
        course: {
          with: {
            courseHoles: true,
          },
        },
        // Uncomment if you add tournamentId to rounds and its relation
        // tournament: true, 
      },
      orderBy: [asc(rounds.number)],
      // where: tournamentId ? eq(rounds.tournamentId, tournamentId) : undefined,
    });
    return query as Promise<RoundWithCourseDetails[]>;
  }

  async getRound(id: number): Promise<RoundWithCourseDetails | undefined> {
    // @ts-ignore
     return db.query.rounds.findFirst({
      where: eq(rounds.id, id),
      with: {
        course: {
          with: {
            courseHoles: true,
          },
        },
        // tournament: true, // If relation added
      },
    }) as Promise<RoundWithCourseDetails | undefined>;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    // @ts-ignore
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async updateRoundStatus(id: number, status: string): Promise<void> {
    // @ts-ignore
    await db.update(rounds).set({ status }).where(eq(rounds.id, id));
  }

  async updateRoundLock(id: number, isLocked: boolean): Promise<void> {
    // @ts-ignore
    await db.update(rounds).set({ isLocked }).where(eq(rounds.id, id));
  }

  async deleteRound(id: number): Promise<void> {
    // @ts-ignore
    const roundMatches = await db.select({id: matches.id}).from(matches).where(eq(matches.roundId, id));
    for (const match of roundMatches) {
        // @ts-ignore
        await db.delete(holeScores).where(eq(holeScores.matchId, match.id));
        // @ts-ignore
        await db.delete(matchPlayers).where(eq(matchPlayers.matchId, match.id));
    }
    // @ts-ignore
    await db.delete(matches).where(eq(matches.roundId, id));
    // @ts-ignore
    await db.delete(rounds).where(eq(rounds.id, id));
  }

  // Matches
  async getMatches(roundIdInput?: number): Promise<MatchWithDetails[]> {
    const queryOptions = {
      with: {
        round: {
          with: {
            course: {
              with: {
                courseHoles: true,
              }
            },
            // tournament: true, // If relation added
          },
        },
        team1: true,
        team2: true,
        matchPlayers: {
          with: {
            player: true,
          },
        },
        holeScores: true,
      },
      orderBy: [asc(matches.roundId), asc(matches.id)],
      where: roundIdInput ? eq(matches.roundId, roundIdInput) : undefined,
    };
    // @ts-ignore
    return db.query.matches.findMany(queryOptions) as Promise<MatchWithDetails[]>;
  }

  async getMatch(id: number): Promise<MatchWithDetails | undefined> {
    // @ts-ignore
    return db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: {
        round: {
          with: {
            course: {
              with: {
                courseHoles: true
              }
            },
            // tournament: true, // If relation added
          },
        },
        team1: true,
        team2: true,
        matchPlayers: {
          with: {
            player: true,
          },
        },
        holeScores: true,
      },
    }) as Promise<MatchWithDetails | undefined>;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    // @ts-ignore
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number, team1Status?: string, team2Status?: string): Promise<void> {
    // @ts-ignore
    await db.update(matches)
      .set({ team1Score, team2Score, currentHole, team1Status, team2Status })
      .where(eq(matches.id, id));
  }

  async updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void> {
    const updateData: Partial<Match> = { status };
    if (team1Status !== undefined) updateData.team1Status = team1Status;
    if (team2Status !== undefined) updateData.team2Status = team2Status;
    // @ts-ignore
    await db.update(matches).set(updateData).where(eq(matches.id, id));
  }

  async updateMatchLock(id: number, isLocked: boolean): Promise<void> {
    // @ts-ignore
    await db.update(matches).set({ isLocked }).where(eq(matches.id, id));
  }

  // Match Players
  async addMatchPlayer(insertMatchPlayer: InsertMatchPlayer): Promise<MatchPlayer> {
    // @ts-ignore
    const [matchPlayer] = await db.insert(matchPlayers).values(insertMatchPlayer).returning();
    return matchPlayer;
  }

  async getMatchPlayers(matchIdInput: number): Promise<(MatchPlayer & { player: Player })[]> {
    // @ts-ignore
    return db.query.matchPlayers.findMany({
      where: eq(matchPlayers.matchId, matchIdInput),
      with: {
        player: true,
      },
    }) as Promise<(MatchPlayer & { player: Player })[]>;
  }

  // Hole Scores
  async updateHoleScore(insertHoleScore: InsertHoleScore): Promise<HoleScore> {
    const { ...restOfHoleScore } = insertHoleScore as any; 
    // @ts-ignore
    const existing = await db.select().from(holeScores)
      .where(and(
        eq(holeScores.matchId, restOfHoleScore.matchId!),
        eq(holeScores.playerId, restOfHoleScore.playerId!),
        eq(holeScores.hole, restOfHoleScore.hole!)
      ));

    if (existing.length > 0) {
      // @ts-ignore
      const [updated] = await db.update(holeScores)
        .set({ strokes: restOfHoleScore.strokes, updatedAt: new Date() })
        .where(eq(holeScores.id, existing[0].id!))
        .returning();
      return updated;
    } else {
      // @ts-ignore
      const [created] = await db.insert(holeScores).values(restOfHoleScore).returning();
      return created;
    }
  }

  async getHoleScores(matchIdInput: number): Promise<HoleScore[]> {
    // @ts-ignore
    return db.select().from(holeScores)
      .where(eq(holeScores.matchId, matchIdInput))
      .orderBy(asc(holeScores.hole), asc(holeScores.playerId));
  }

  // Tournament Standings
  async getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]> {
    // @ts-ignore
    return db.query.tournamentStandings.findMany({
      with: {
        team: true,
      },
    }) as Promise<(TournamentStanding & { team: Team })[]>;
  }

  async updateTournamentStanding(teamId: number, roundPoints: Partial<TournamentStanding>): Promise<void> {
    // @ts-ignore
    const existing = await db.select().from(tournamentStandings)
      .where(eq(tournamentStandings.teamId, teamId));

    if (existing.length > 0) {
      // @ts-ignore
      await db.update(tournamentStandings)
        .set(roundPoints)
        .where(eq(tournamentStandings.teamId, teamId));
    } else {
      // @ts-ignore
      await db.insert(tournamentStandings)
        .values({ teamId, ...roundPoints } as InsertTournamentStanding);
    }
  }

  // Tournaments
  async getTournaments(): Promise<Tournament[]> {
    // @ts-ignore
    return db.select().from(tournaments).orderBy(desc(tournaments.year), asc(tournaments.name));
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    // @ts-ignore
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async getActiveTournament(): Promise<Tournament | undefined> {
    // @ts-ignore
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.isActive, true)).limit(1);
    return tournament;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    // @ts-ignore
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }

  async updateTournamentActive(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // @ts-ignore
      await db.update(tournaments).set({ isActive: false }).where(eq(tournaments.isActive, true));
    }
    // @ts-ignore
    await db.update(tournaments).set({ isActive }).where(eq(tournaments.id, id));
  }
}

export const storage = new DatabaseStorage();