import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import {
  insertTeamSchema, insertPlayerSchema, insertCourseSchema,
  insertRoundSchema, insertMatchSchema, insertHoleScoreSchema,
  insertMatchPlayerSchema, insertUserSchema, insertTournamentSchema, // Added InsertTournament
  insertCourseHoleSchema, // Added InsertCourseHole
  type RoundWithCourseDetails, // Import if using for response types
  type CourseWithHoles, // Import if using for response types
} from "@shared/schema";

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
    isAuthenticated?: boolean;
    userRole?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'rowdycup-session-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: object) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (req.session?.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ error: 'Authentication required' });
    }
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.session?.isAuthenticated && req.session?.userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  }

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
      // PIN validation (if strict 4 digits)
      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        // return res.status(400).json({ error: 'PIN must be 4 digits.' });
        // Or allow any password for now if PIN validation is only on client/user creation
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is disabled' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      req.session.userRole = user.role;

      const { passwordHash: _, ...userInfo } = user;
      res.json({
        user: userInfo,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid'); // Ensure cookie is cleared
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session?.isAuthenticated || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    storage.getUserById(req.session.userId)
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        const { passwordHash: _hash, ...userInfo } = user;
        res.json({ user: userInfo });
      })
      .catch(error => {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
      });
  });

  // User management routes (admin only)
  app.post('/api/users', requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const { passwordHash: pin, ...restOfUser } = userData;

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
         // return res.status(400).json({ error: 'PIN must be 4 digits.' });
         // For now, allowing any length to match existing behavior if not strict
      }

      const saltRounds = 12;
      const actualPasswordHash = await bcrypt.hash(pin, saltRounds);

      const user = await storage.createUser({
        ...restOfUser,
        passwordHash: actualPasswordHash
      });

      const { passwordHash: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.issues) { // Zod validation error
        return res.status(400).json({ error: 'Invalid user data', details: error.issues });
      }
      res.status(400).json({ error: 'Invalid user data or server error' });
    }
  });

  app.get('/api/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersAll();
      const usersWithoutPasswords = users.map(user => {
        const { passwordHash: _, ...userInfo } = user;
        return userInfo;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Teams routes
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

  // Course Holes Routes (New)
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
  app.get('/api/rounds', async (req, res) => { // Consider adding tournamentId filter
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

  // New endpoint for locking/unlocking rounds
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
      await storage.deleteRound(id); // Ensure this method exists in storage
      broadcast({ type: 'round_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Delete round error:', error);
      res.status(500).json({ error: 'Failed to delete round' });
    }
  });


  // Matches routes
  app.get('/api/matches', async (req, res) => { // All matches, or filter by roundId
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      const matches = await storage.getMatches(roundId);
      res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error)
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  app.get('/api/rounds/:roundId/matches', async (req, res) => { // Specific to a round
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

  app.patch('/api/matches/:id/score', requireAdmin, async (req, res) => { // Should be requireAdmin or player involved
    try {
      const id = parseInt(req.params.id);
      const { team1Score, team2Score, currentHole, team1Status, team2Status } = req.body;
      // Add validation for score types and currentHole if necessary
      await storage.updateMatchScore(id, team1Score, team2Score, currentHole, team1Status, team2Status);

      const updatedMatch = await storage.getMatch(id);
      broadcast({ type: 'match_score_updated', data: updatedMatch });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update match score' });
    }
  });

  app.patch('/api/matches/:id/status', requireAdmin, async (req, res) => { // Should be requireAdmin or player involved
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
  
  // New endpoint for locking/unlocking matches
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