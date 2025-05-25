import {
  teams, players, courses, rounds, matches, matchPlayers, holeScores, tournamentStandings, profiles,
  courseHoles, tournaments, // <-- Added tournaments import
  type Team, type Player, type Course, type Round, type Match, type MatchPlayer,
  type HoleScore, type TournamentStanding, type Profile, type CourseHole, // New type import
  type InsertTeam, type InsertPlayer, type InsertCourse, type InsertRound, type InsertMatch, type InsertMatchPlayer,
  type InsertHoleScore, type InsertTournamentStanding, type InsertProfile, type InsertCourseHole, // New insert type
  type MatchWithDetails, type TeamWithStandings, type CourseWithHoles, // New type for course with holes
  type RoundWithCourseDetails, type Tournament, type InsertTournament // <-- Add Tournament and InsertTournament
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<TeamWithStandings[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Players
  getPlayers(): Promise<Player[]>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;

  // Profiles
  getProfileByProfilename(username: string): Promise<Profile | undefined>;
  getProfileById(id: number): Promise<Profile | undefined>;
  getProfilesAll(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, updates: Partial<Profile>): Promise<void>;

  // Courses
  getCourses(): Promise<CourseWithHoles[]>; // Updated return type
  getCourse(id: number): Promise<CourseWithHoles | undefined>; // Updated return type
  createCourse(course: InsertCourse): Promise<Course>;
  createCourseHole(courseHole: InsertCourseHole): Promise<CourseHole>; // New method
  getCourseHoles(courseId: number): Promise<CourseHole[]>; // New method

  // Rounds
  getRounds(tournamentId?: number): Promise<RoundWithCourseDetails[]>; // Updated return type, optional filter
  getRound(id: number): Promise<RoundWithCourseDetails | undefined>; // Updated return type
  createRound(round: InsertRound): Promise<Round>;
  updateRoundStatus(id: number, status: string): Promise<void>;
  updateRoundLock(id: number, isLocked: boolean): Promise<void>; // New method

  // Matches
  getMatches(roundId?: number): Promise<MatchWithDetails[]>; // Optional filter
  getMatch(id: number): Promise<MatchWithDetails | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number, team1Status?: string, team2Status?: string): Promise<void>; // Added team statuses
  updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void>;
  updateMatchLock(id: number, isLocked: boolean): Promise<void>; // New method
  deleteRound(id: number): Promise<void>; // Added deleteRound method


  // Match Players
  addMatchPlayer(matchPlayer: InsertMatchPlayer): Promise<MatchPlayer>;
  getMatchPlayers(matchId: number): Promise<(MatchPlayer & { player: Player })[]>;

  // Hole Scores
  updateHoleScore(holeScore: InsertHoleScore): Promise<HoleScore>; // par is removed from InsertHoleScore
  getHoleScores(matchId: number): Promise<HoleScore[]>;

  // Tournament Standings
  getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]>;
  updateTournamentStanding(teamId: number, roundPoints: Partial<TournamentStanding>): Promise<void>;

  // Tournaments
  getTournaments(): Promise<Tournament[]>; // New method
  getTournament(id: number): Promise<Tournament | undefined>; // New method
  getActiveTournament(): Promise<Tournament | undefined>; // New Method
  createTournament(tournament: InsertTournament): Promise<Tournament>; // New method
  updateTournamentActive(id: number, isActive: boolean): Promise<void>; // New method
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<TeamWithStandings[]> {
    return db.query.teams.findMany({
      with: {
        players: true,
        standings: true,
      },
      orderBy: [asc(teams.name)]
    }) as Promise<TeamWithStandings[]>;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  // Players
  async getPlayers(): Promise<Player[]> {
    return db.select().from(players).orderBy(asc(players.name));
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  // Profiles
  async getProfileByProfilename(username: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.username, username));
    return profile || undefined;
  }

  async getProfileById(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async getProfilesAll(): Promise<Profile[]> {
    return db.select().from(profiles).orderBy(asc(profiles.username));
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async updateProfile(id: number, updates: Partial<Profile>): Promise<void> {
    await db.update(profiles).set(updates).where(eq(profiles.id, id));
  }

  // Courses
  async getCourses(): Promise<CourseWithHoles[]> {
    const coursesRaw = await db.query.courses.findMany({
      with: {
        courseHoles: true, // Eager load course holes
      },
      orderBy: [asc(courses.name)]
    });
    return coursesRaw.map(course => ({
      ...course,
      holes: course.courseHoles,
    })) as CourseWithHoles[];
  }

  async getCourse(id: number): Promise<CourseWithHoles | undefined> {
    return db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        courseHoles: true,
      },
    }) as Promise<CourseWithHoles | undefined>;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async createCourseHole(insertCourseHole: InsertCourseHole): Promise<CourseHole> {
    const [hole] = await db.insert(courseHoles).values(insertCourseHole).returning();
    return hole;
  }
  async getCourseHoles(courseIdInput: number): Promise<CourseHole[]> {
    return db.select().from(courseHoles).where(eq(courseHoles.courseId, courseIdInput)).orderBy(asc(courseHoles.holeNumber));
  }


  // Rounds
  async getRounds(tournamentId?: number): Promise<RoundWithCourseDetails[]> {
    const query = db.query.rounds.findMany({
      with: {
        course: {
          with: {
            courseHoles: true, // Eager load course holes through course
          },
        },
      },
      orderBy: [asc(rounds.number)],
      where: tournamentId ? eq((rounds as any).tournamentId, tournamentId) : undefined, // Add tournamentId filter
    });
    return query as Promise<RoundWithCourseDetails[]>;
  }

  async getRound(id: number): Promise<RoundWithCourseDetails | undefined> {
     return db.query.rounds.findFirst({
      where: eq(rounds.id, id),
      with: {
        course: {
          with: {
            courseHoles: true,
          },
        },
      },
    }) as Promise<RoundWithCourseDetails | undefined>;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async updateRoundStatus(id: number, status: string): Promise<void> {
    await db.update(rounds).set({ status }).where(eq(rounds.id, id));
  }

  async updateRoundLock(id: number, isLocked: boolean): Promise<void> { // New method
    await db.update(rounds).set({ isLocked }).where(eq(rounds.id, id));
  }

  async deleteRound(id: number): Promise<void> {
    // Optional: Add logic to check if round can be deleted (e.g., no completed matches)
    // For now, direct delete:
    // First delete dependent matches (or handle with cascade delete in DB schema if set up)
    const roundMatches = await db.select({id: matches.id}).from(matches).where(eq(matches.roundId, id));
    for (const match of roundMatches) {
        await db.delete(holeScores).where(eq(holeScores.matchId, match.id));
        await db.delete(matchPlayers).where(eq(matchPlayers.matchId, match.id));
    }
    await db.delete(matches).where(eq(matches.roundId, id));
    await db.delete(rounds).where(eq(rounds.id, id));
  }


  // Matches
  async getMatches(roundIdInput?: number): Promise<MatchWithDetails[]> {
    return db.query.matches.findMany({
      with: {
        round: {
          with: {
            course: {
              with: {
                courseHoles: true,
              }
            },
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
    }) as Promise<MatchWithDetails[]>;
  }
  
  async getMatch(id: number): Promise<MatchWithDetails | undefined> {
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
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number, team1Status?: string, team2Status?: string): Promise<void> {
    await db.update(matches)
      .set({ team1Score, team2Score, currentHole, team1Status, team2Status })
      .where(eq(matches.id, id));
  }

  async updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void> {
    const updateData: Partial<Match> = { status }; // Use Partial<Match>
    if (team1Status !== undefined) updateData.team1Status = team1Status;
    if (team2Status !== undefined) updateData.team2Status = team2Status;

    await db.update(matches).set(updateData).where(eq(matches.id, id));
  }

  async updateMatchLock(id: number, isLocked: boolean): Promise<void> { // New method
    await db.update(matches).set({ isLocked }).where(eq(matches.id, id));
  }

  // Match Players
  async addMatchPlayer(insertMatchPlayer: InsertMatchPlayer): Promise<MatchPlayer> {
    const [matchPlayer] = await db.insert(matchPlayers).values(insertMatchPlayer).returning();
    return matchPlayer;
  }

  async getMatchPlayers(matchIdInput: number): Promise<(MatchPlayer & { player: Player })[]> {
    return db.query.matchPlayers.findMany({
      where: eq(matchPlayers.matchId, matchIdInput),
      with: {
        player: true,
      },
    }) as Promise<(MatchPlayer & { player: Player })[]>;
  }

  // Hole Scores
  async updateHoleScore(insertHoleScore: InsertHoleScore): Promise<HoleScore> {
    // Par is removed from InsertHoleScore and holeScores table, it comes from courseHoles
    const { par, ...restOfHoleScore } = insertHoleScore as any; // Cast to remove par if it's still passed

    const existing = await db.select().from(holeScores)
      .where(and(
        eq(holeScores.matchId, restOfHoleScore.matchId!),
        eq(holeScores.playerId, restOfHoleScore.playerId!),
        eq(holeScores.hole, restOfHoleScore.hole!)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(holeScores)
        .set({ strokes: restOfHoleScore.strokes, updatedAt: new Date() })
        .where(eq(holeScores.id, existing[0].id!))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(holeScores).values(restOfHoleScore).returning();
      return created;
    }
  }

  async getHoleScores(matchIdInput: number): Promise<HoleScore[]> {
    return db.select().from(holeScores)
      .where(eq(holeScores.matchId, matchIdInput))
      .orderBy(asc(holeScores.hole), asc(holeScores.playerId));
  }

  // Tournament Standings
  async getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]> {
    return db.query.tournamentStandings.findMany({
      with: {
        team: true,
      },
    }) as Promise<(TournamentStanding & { team: Team })[]>;
  }

  async updateTournamentStanding(teamId: number, roundPoints: Partial<TournamentStanding>): Promise<void> {
    const existing = await db.select().from(tournamentStandings)
      .where(eq(tournamentStandings.teamId, teamId));

    if (existing.length > 0) {
      await db.update(tournamentStandings)
        .set(roundPoints)
        .where(eq(tournamentStandings.teamId, teamId));
    } else {
      await db.insert(tournamentStandings)
        .values({ teamId, ...roundPoints } as InsertTournamentStanding); // Cast to ensure type safety
    }
  }

  // Tournaments (New Methods)
  async getTournaments(): Promise<Tournament[]> {
    return db.select().from(tournaments).orderBy(desc(tournaments.year), asc(tournaments.name));
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async getActiveTournament(): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.isActive, true)).limit(1);
    return tournament;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }

  async updateTournamentActive(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // If setting a tournament to active, ensure all others are inactive
      await db.update(tournaments).set({ isActive: false }).where(eq(tournaments.isActive, true));
    }
    await db.update(tournaments).set({ isActive }).where(eq(tournaments.id, id));
  }
}

export const storage = new DatabaseStorage();