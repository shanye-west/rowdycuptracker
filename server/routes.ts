import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertTeamSchema, insertPlayerSchema, insertCourseSchema, 
  insertRoundSchema, insertMatchSchema, insertHoleScoreSchema,
  insertMatchPlayerSchema, insertUserSchema
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
      secure: false, // Set to true in production with HTTPS
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

      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is disabled' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      req.session.userRole = user.role;

      // Return user info (without password hash)
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
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session?.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get current user info
    storage.getUserById(req.session.userId!)
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.passwordHash, saltRounds);
      
      const user = await storage.createUser({
        ...userData,
        passwordHash
      });
      
      // Return user info without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ error: 'Invalid user data' });
    }
  });

  app.get('/api/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersAll();
      // Remove password hashes from response
      const usersWithoutPasswords = users.map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    } catch (error) {
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
    } catch (error) {
      res.status(400).json({ error: 'Invalid player data' });
    }
  });

  // Courses routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  app.post('/api/courses', async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      res.status(400).json({ error: 'Invalid course data' });
    }
  });

  // Rounds routes
  app.get('/api/rounds', async (req, res) => {
    try {
      const rounds = await storage.getRounds();
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rounds' });
    }
  });

  app.post('/api/rounds', requireAdmin, async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(roundData);
      broadcast({ type: 'round_created', data: round });
      res.json(round);
    } catch (error) {
      res.status(400).json({ error: 'Invalid round data' });
    }
  });

  app.patch('/api/rounds/:id/status', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateRoundStatus(id, status);
      broadcast({ type: 'round_status_updated', data: { id, status } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update round status' });
    }
  });

  // Matches routes
  app.get('/api/matches', async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  app.get('/api/rounds/:roundId/matches', async (req, res) => {
    try {
      const roundId = parseInt(req.params.roundId);
      if (isNaN(roundId)) {
        return res.status(400).json({ error: 'Invalid round ID' });
      }
      console.log(`Fetching matches for round ${roundId}`);
      const matches = await storage.getMatchesByRound(roundId);
      console.log(`Found ${matches.length} matches for round ${roundId}`);
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
    } catch (error) {
      res.status(400).json({ error: 'Invalid match data' });
    }
  });

  app.patch('/api/matches/:id/score', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { team1Score, team2Score, currentHole } = req.body;
      await storage.updateMatchScore(id, team1Score, team2Score, currentHole);
      
      const updatedMatch = await storage.getMatch(id);
      broadcast({ type: 'match_score_updated', data: updatedMatch });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update match score' });
    }
  });

  app.patch('/api/matches/:id/status', async (req, res) => {
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

  // Match Players routes
  app.post('/api/matches/:matchId/players', async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const playerData = insertMatchPlayerSchema.parse({ ...req.body, matchId });
      const matchPlayer = await storage.addMatchPlayer(playerData);
      res.json(matchPlayer);
    } catch (error) {
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

  // Hole Scores routes
  app.post('/api/hole-scores', async (req, res) => {
    try {
      const scoreData = insertHoleScoreSchema.parse(req.body);
      const holeScore = await storage.updateHoleScore(scoreData);
      
      // Broadcast real-time score update
      broadcast({ type: 'hole_score_updated', data: holeScore });
      res.json(holeScore);
    } catch (error) {
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

  app.patch('/api/standings/:teamId', async (req, res) => {
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

  return httpServer;
}
