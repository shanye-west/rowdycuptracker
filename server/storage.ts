import { 
  teams, players, courses, rounds, matches, matchPlayers, holeScores, tournamentStandings, users,
  type Team, type Player, type Course, type Round, type Match, type MatchPlayer, 
  type HoleScore, type TournamentStanding, type User, type InsertTeam, type InsertPlayer,
  type InsertCourse, type InsertRound, type InsertMatch, type InsertMatchPlayer,
  type InsertHoleScore, type InsertTournamentStanding, type InsertUser, type MatchWithDetails,
  type TeamWithStandings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<TeamWithStandings[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  
  // Players
  getPlayers(): Promise<Player[]>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  
  // Users
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUsersAll(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<void>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Rounds
  getRounds(): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRoundStatus(id: number, status: string): Promise<void>;
  
  // Matches
  getMatches(): Promise<MatchWithDetails[]>;
  getMatchesByRound(roundId: number): Promise<MatchWithDetails[]>;
  getMatch(id: number): Promise<MatchWithDetails | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number): Promise<void>;
  updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void>;
  
  // Match Players
  addMatchPlayer(matchPlayer: InsertMatchPlayer): Promise<MatchPlayer>;
  getMatchPlayers(matchId: number): Promise<(MatchPlayer & { player: Player })[]>;
  
  // Hole Scores
  updateHoleScore(holeScore: InsertHoleScore): Promise<HoleScore>;
  getHoleScores(matchId: number): Promise<HoleScore[]>;
  
  // Tournament Standings
  getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]>;
  updateTournamentStanding(teamId: number, roundPoints: Partial<TournamentStanding>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<TeamWithStandings[]> {
    const teamsData = await db.select().from(teams);
    
    const result: TeamWithStandings[] = [];
    for (const team of teamsData) {
      // Get players for this team
      const teamPlayers = await db.select().from(players).where(eq(players.teamId, team.id));
      
      // Get standings for this team
      const [standings] = await db.select().from(tournamentStandings).where(eq(tournamentStandings.teamId, team.id));
      
      result.push({
        ...team,
        players: teamPlayers,
        standings: standings || null
      });
    }
    
    return result;
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
    return await db.select().from(players).orderBy(asc(players.name));
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsersAll(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(asc(users.username));
    return allUsers;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, id));
  }
  
  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  // Rounds
  async getRounds(): Promise<Round[]> {
    return await db.select().from(rounds).orderBy(asc(rounds.number));
  }

  async getRound(id: number): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round || undefined;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async updateRoundStatus(id: number, status: string): Promise<void> {
    await db.update(rounds).set({ status }).where(eq(rounds.id, id));
  }

  // Matches
  async getMatches(): Promise<MatchWithDetails[]> {
    return await db.query.matches.findMany({
      with: {
        round: {
          with: {
            course: true,
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
    }) as MatchWithDetails[];
  }

  async getMatchesByRound(roundId: number): Promise<MatchWithDetails[]> {
    try {
      console.log(`Storage: Fetching matches for round ${roundId}`);
      const result = await db.query.matches.findMany({
        where: eq(matches.roundId, roundId),
        with: {
          round: {
            with: {
              course: true,
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
      }) as MatchWithDetails[];
      console.log(`Storage: Found ${result.length} matches for round ${roundId}`);
      return result;
    } catch (error) {
      console.error(`Storage error for getMatchesByRound(${roundId}):`, error);
      throw error;
    }
  }

  async getMatch(id: number): Promise<MatchWithDetails | undefined> {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: {
        round: {
          with: {
            course: true,
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
    });
    return match as MatchWithDetails | undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatchScore(id: number, team1Score: number, team2Score: number, currentHole: number): Promise<void> {
    await db.update(matches)
      .set({ team1Score, team2Score, currentHole })
      .where(eq(matches.id, id));
  }

  async updateMatchStatus(id: number, status: string, team1Status?: string, team2Status?: string): Promise<void> {
    const updateData: Record<string, string> = { status };
    if (team1Status) updateData.team1Status = team1Status;
    if (team2Status) updateData.team2Status = team2Status;
    
    await db.update(matches).set(updateData).where(eq(matches.id, id));
  }

  // Match Players
  async addMatchPlayer(insertMatchPlayer: InsertMatchPlayer): Promise<MatchPlayer> {
    const [matchPlayer] = await db.insert(matchPlayers).values(insertMatchPlayer).returning();
    return matchPlayer;
  }

  async getMatchPlayers(matchId: number): Promise<(MatchPlayer & { player: Player })[]> {
    return await db.query.matchPlayers.findMany({
      where: eq(matchPlayers.matchId, matchId),
      with: {
        player: true,
      },
    }) as (MatchPlayer & { player: Player })[];
  }

  // Hole Scores
  async updateHoleScore(insertHoleScore: InsertHoleScore): Promise<HoleScore> {
    const existing = await db.select().from(holeScores)
      .where(and(
        eq(holeScores.matchId, insertHoleScore.matchId!),
        eq(holeScores.playerId, insertHoleScore.playerId!),
        eq(holeScores.hole, insertHoleScore.hole)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(holeScores)
        .set({ strokes: insertHoleScore.strokes, updatedAt: new Date() })
        .where(eq(holeScores.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(holeScores).values(insertHoleScore).returning();
      return created;
    }
  }

  async getHoleScores(matchId: number): Promise<HoleScore[]> {
    return await db.select().from(holeScores)
      .where(eq(holeScores.matchId, matchId))
      .orderBy(asc(holeScores.hole), asc(holeScores.playerId));
  }

  // Tournament Standings
  async getTournamentStandings(): Promise<(TournamentStanding & { team: Team })[]> {
    return await db.query.tournamentStandings.findMany({
      with: {
        team: true,
      },
    }) as (TournamentStanding & { team: Team })[];
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
        .values({ teamId, ...roundPoints });
    }
  }
}

export const storage = new DatabaseStorage();
