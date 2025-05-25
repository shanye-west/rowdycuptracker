import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from './storage'; // storage instance from DatabaseStorage

// Verify DATABASE_URL is loaded at startup
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('Make sure you have a .env file in your project root with:');
  console.error('DATABASE_URL=your_database_connection_string');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');
console.log('Database URL preview:', (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 20) ? process.env.DATABASE_URL.substring(0, 20) + '...' : process.env.DATABASE_URL);

// Debug: print the database URL and current number of matches for round 1
console.log('DEBUG: Using DATABASE_URL =', process.env.DATABASE_URL);
storage.getMatches(1) // UPDATED THIS LINE: Changed getMatchesByRound to getMatches
  .then(matches => console.log(`DEBUG: Round 1 matches count: ${matches.length}`))
  .catch(err => console.error('DEBUG: Error fetching matches for round 1 via storage:', err));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) { // Added :any to bodyJson and ...args for broader compatibility
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args as any[]]); // Ensure args is spread correctly
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Server error:', err);
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on http://localhost:${port}`);
      log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`🗄️  Database: Connected`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();