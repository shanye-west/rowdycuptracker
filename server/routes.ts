// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import {
  insertTeamSchema, insertPlayerSchema, insertCourseSchema,
  insertRoundSchema, insertMatchSchema, insertHoleScoreSchema,
  insertMatchPlayerSchema, insertProfileSchema, insertTournamentSchema,
  insertCourseHoleSchema,
  type RoundWithCourseDetails,
  type CourseWithHoles,
  type Profile, // Use Profile type
} from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    // Renamed userId to profileId to reflect it's the ID from 'profiles' table (which is auth.uid())
    profileId?: string; // UUIDs are strings
    isAuthenticated?: boolean;
    profileRole?: string; // Renamed userRole to profileRole
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.use(session({
    secret: process.env.SESSION_SECRET || 'rowdycup-session-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');
    ws.on('close', () => { clients.delete(ws); console.log('WebSocket client disconnected'); });
    ws.on('error', (error) => { console.error('WebSocket error:', error); clients.delete(ws); });
  });

  function broadcast(data: object) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  }

  function requireAuth(req: any, res: any, next: any) {
    if (req.session?.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ error: 'Authentication required' });
    }
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.session?.isAuthenticated && req.session?.profileRole === 'admin') { // Changed userRole to profileRole
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  }

  // Authentication routes - THESE WILL BE PHASED OUT / REPLACED BY SUPABASE CLIENT AUTH
  // For now, we are just making them not crash the server on startup due to import errors.
  // The client-side auth.tsx will use Supabase directly.
  app.post('/api/auth/login', async (req, res) => {
    // This endpoint is now largely superseded by client-side Supabase auth.
    // Keeping it to prevent 404s if old client code (or tests) hit it, but it shouldn't be primary.
    // The client/src/lib/auth.tsx uses supabase.auth.signInWithPassword directly.
    try {
      const { username, password: pin } = req.body;
      if (!username || !pin) {
        return res.status(400).json({ error: 'Username and PIN required' });
      }

      // This logic now needs to simulate what Supabase auth does or be removed.
      // For now, let's assume it's a legacy endpoint.
      // const profile = await storage.getProfileByUsername(username);
      // if (!profile || !profile.passwordHash) { // passwordHash is not in profiles table
      //   return res.status(401).json({ error: 'Invalid credentials (profile/hash missing)' });
      // }
      // const isValidPassword = await bcrypt.compare(pin, profile.passwordHash);
      // if (!isValidPassword) {
      //   return res.status(401).json({ error: 'Invalid credentials' });
      // }
      // req.session.profileId = profile.id;
      // req.session.isAuthenticated = true;
      // req.session.profileRole = profile.role;
      // const { passwordHash: _, ...profileInfo } = profile;
      // res.json({ profile: profileInfo, message: 'Login successful (legacy endpoint)' });

      res.status(501).json({ error: "Legacy login endpoint. Use client-side Supabase auth." });

    } catch (error) {
      console.error('Legacy login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    // Client-side will call supabase.auth.signOut(). This Express endpoint handles session destruction.
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    // This endpoint is also superseded by client-side supabase.auth.getSession() and profile fetching.
    if (!req.session?.isAuthenticated || !req.session.profileId) {
      return res.status(401).json({ error: 'Not authenticated via session' });
    }
    try {
      const profile = await storage.getProfileById(req.session.profileId); // profileId is UUID string
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found for session' });
      }
      // passwordHash is not in profile object anymore
      res.json({ user: profile }); // Changed key to 'user' to match client/src/lib/auth.tsx expectation
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile info' });
    }
  });

  // User/Profile management routes (admin only)
  // This endpoint needs to be refactored to use Supabase Admin SDK to create auth.users
  // and rely on the trigger to create the profile.
  app.post('/api/profiles', requireAdmin, async (req, res) => {
    // const profileData = insertProfileSchema.parse(req.body); // Assuming req.body has necessary profile fields + PIN
    // This endpoint is complex due to needing Supabase Admin SDK for auth user creation
    // and then trigger handles profile. For now, return 501.
    console.warn("/api/profiles POST endpoint hit - this should be handled by Supabase Admin SDK calls for user creation.");
    return res.status(501).json({ error: "Profile creation should be handled via Supabase admin functions and triggers."});
  });

  app.get('/api/profiles', requireAdmin, async (req, res) => { // Changed from /api/users
    try {
      const profiles = await storage.getProfilesAll();
      // No passwordHash to remove from profiles
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  });

  // Teams routes (remain largely the same, using storage)
  app.get('/api/teams', async (req, res) => {
  try {
    const teams = await storage.getTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

  app.post('/api/teams', requireAdmin, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      broadcast({ type: 'team_created', data: team });
      res.json(team);
    } catch (error: any) {
      console.error("Create team error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid team data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid team data' });
    }
  });

  // Players routes
  app.get('/api/players', async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch players' });
    }
  });

  app.get('/api/teams/:teamId/players', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const players = await storage.getPlayersByTeam(teamId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team players' });
    }
  });

  app.post('/api/players', requireAdmin, async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      broadcast({ type: 'player_created', data: player });
      res.json(player);
    } catch (error: any) {
      console.error("Create player error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid player data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid player data' });
    }
  });

  // Courses routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses: CourseWithHoles[] = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course: CourseWithHoles | undefined = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch course' });
    }
  });

  app.post('/api/courses', requireAdmin, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      broadcast({ type: 'course_created', data: course });
      res.json(course);
    } catch (error: any) {
      console.error("Create course error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid course data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid course data' });
    }
  });

  // Course Holes Routes
  app.post('/api/courses/:courseId/holes', requireAdmin, async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const holeData = insertCourseHoleSchema.parse({ ...req.body, courseId });
        const hole = await storage.createCourseHole(holeData);
        broadcast({ type: 'course_hole_created', data: hole });
        res.status(201).json(hole);
    } catch (error: any) {
        console.error("Create course hole error:", error);
        if (error.issues) {
            return res.status(400).json({ error: 'Invalid course hole data', details: error.issues });
        }
        res.status(400).json({ error: 'Invalid course hole data' });
    }
  });

  app.get('/api/courses/:courseId/holes', async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const holes = await storage.getCourseHoles(courseId);
        res.json(holes);
    } catch (error) {
        console.error("Get course holes error:", error);
        res.status(500).json({ error: 'Failed to fetch course holes' });
    }
  });

  // Rounds routes
  app.get('/api/rounds', async (req, res) => {
    try {
      const tournamentId = req.query.tournamentId ? parseInt(req.query.tournamentId as string) : undefined;
      const rounds: RoundWithCourseDetails[] = await storage.getRounds(tournamentId);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rounds' });
    }
  });

  app.get('/api/rounds/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const round = await storage.getRound(id);
        if (!round) {
            return res.status(404).json({ error: 'Round not found' });
        }
        res.json(round);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch round' });
    }
  });

  app.post('/api/rounds', requireAdmin, async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(roundData);
      broadcast({ type: 'round_created', data: round });
      res.json(round);
    } catch (error: any) {
      console.error("Create round error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid round data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid round data' });
    }
  });

  app.patch('/api/rounds/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (typeof status !== 'string' || !['upcoming', 'live', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      await storage.updateRoundStatus(id, status);
      broadcast({ type: 'round_status_updated', data: { id, status } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update round status' });
    }
  });

  app.patch('/api/rounds/:id/lock', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isLocked } = req.body;
      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ error: 'Invalid isLocked value. Must be true or false.' });
      }
      await storage.updateRoundLock(id, isLocked);
      broadcast({ type: 'round_lock_updated', data: { id, isLocked } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update round lock status' });
    }
  });

  app.delete('/api/rounds/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRound(id);
      broadcast({ type: 'round_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete round error:', error);
      res.status(500).json({ error: 'Failed to delete round' });
    }
  });

  // Matches routes
  app.get('/api/matches', async (req, res) => {
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      const matches = await storage.getMatches(roundId);
      res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error)
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  app.get('/api/rounds/:roundId/matches', async (req, res) => {
    try {
      const roundId = parseInt(req.params.roundId);
      if (isNaN(roundId)) {
        return res.status(400).json({ error: 'Invalid round ID' });
      }
      const matches = await storage.getMatches(roundId);
      res.json(matches);
    } catch (error) {
      console.error(`Error fetching matches for round ${req.params.roundId}:`, error);
      res.status(500).json({ error: 'Failed to fetch round matches', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const match = await storage.getMatch(id);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch match' });
    }
  });

  app.post('/api/matches', requireAdmin, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      broadcast({ type: 'match_created', data: match });
      res.json(match);
    } catch (error: any) {
      console.error("Create match error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid match data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid match data' });
    }
  });

  app.patch('/api/matches/:id/score', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { team1Score, team2Score, currentHole, team1Status, team2Status } = req.body;
      await storage.updateMatchScore(id, team1Score, team2Score, currentHole, team1Status, team2Status);
      const updatedMatch = await storage.getMatch(id);
      broadcast({ type: 'match_score_updated', data: updatedMatch });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update match score' });
    }
  });

  app.patch('/api/matches/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, team1Status, team2Status } = req.body;
      await storage.updateMatchStatus(id, status, team1Status, team2Status);
      const updatedMatch = await storage.getMatch(id);
      broadcast({ type: 'match_status_updated', data: updatedMatch });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update match status' });
    }
  });

  app.patch('/api/matches/:id/lock', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isLocked } = req.body;
       if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ error: 'Invalid isLocked value. Must be true or false.' });
      }
      await storage.updateMatchLock(id, isLocked);
      broadcast({ type: 'match_lock_updated', data: { id, isLocked } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update match lock status' });
    }
  });

  // Match Players routes
  app.post('/api/matches/:matchId/players', requireAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const playerData = insertMatchPlayerSchema.parse({ ...req.body, matchId });
      const matchPlayer = await storage.addMatchPlayer(playerData);
      broadcast({ type: 'match_player_added', data: matchPlayer });
      res.json(matchPlayer);
    } catch (error: any) {
      console.error("Add match player error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid match player data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid match player data' });
    }
  });

  app.get('/api/matches/:matchId/players', async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const players = await storage.getMatchPlayers(matchId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch match players' });
    }
  });

  // Hole Scores routes - Client will use Supabase client for this, but keep for now if any server-side logic needs it.
  app.post('/api/hole-scores', requireAuth, async (req, res) => {
    try {
      // Consider if this endpoint is still needed or if client will write directly.
      // If kept, ensure auth allows player to submit for their own match or if admin.
      console.warn("/api/hole-scores POST endpoint hit. Consider client-side Supabase calls.");
      const scoreData = insertHoleScoreSchema.parse(req.body);
      const holeScore = await storage.updateHoleScore(scoreData);
      broadcast({ type: 'hole_score_updated', data: holeScore });
      res.json(holeScore);
    } catch (error: any) {
      console.error("Update hole score error:", error)
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid hole score data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid hole score data' });
    }
  });

  app.get('/api/matches/:matchId/scores', async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const scores = await storage.getHoleScores(matchId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch hole scores' });
    }
  });

  // Tournament Standings routes
  app.get('/api/standings', async (req, res) => {
    try {
      const standings = await storage.getTournamentStandings();
      res.json(standings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournament standings' });
    }
  });

  app.patch('/api/standings/:teamId', requireAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const standingData = req.body;
      await storage.updateTournamentStanding(teamId, standingData);
      const standings = await storage.getTournamentStandings();
      broadcast({ type: 'standings_updated', data: standings });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update tournament standings' });
    }
  });

  // Tournaments Routes
  app.get('/api/tournaments', async (req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
  });

  app.get('/api/tournaments/active', async (req, res) => {
    try {
      const tournament = await storage.getActiveTournament();
      if (!tournament) {
        // Return 200 with null or empty object if no active tournament is not an "error" for the client
        return res.status(200).json(null);
        // return res.status(404).json({ error: 'No active tournament found' });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active tournament' });
    }
  });

  app.get('/api/tournaments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournament' });
    }
  });

  app.post('/api/tournaments', requireAdmin, async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);
      broadcast({ type: 'tournament_created', data: tournament });
      res.status(201).json(tournament);
    } catch (error: any) {
      console.error("Create tournament error:", error);
      if (error.issues) {
        return res.status(400).json({ error: 'Invalid tournament data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid tournament data' });
    }
  });

  app.patch('/api/tournaments/:id/active', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'Invalid isActive value. Must be true or false.' });
      }
      await storage.updateTournamentActive(id, isActive);
      const tournaments = await storage.getTournaments();
      broadcast({ type: 'tournament_active_updated', data: { id, isActive, tournaments } });
      res.json({ success: true });
    } catch (error) {
      console.error("Update tournament active error:", error);
      res.status(500).json({ error: 'Failed to update tournament active status' });
    }
  });

  return httpServer;
}