// server/db.ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Import for ES module path resolution

// ES module-friendly way to get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set in server/.env. Did you forget to add it?");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to add it to your server/.env file?"
  );
} else {
  console.log("DATABASE_URL loaded successfully in server/db.ts");
  // Mask the password for logging
  const urlParts = process.env.DATABASE_URL.split(':');
  if (urlParts.length > 2) {
    const maskedUrl = `${urlParts[0]}:${urlParts[1]}:********@${urlParts[2].substring(urlParts[2].indexOf('@') + 1)}`;
    console.log(`Connecting to: ${maskedUrl}`);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false, // Required for Supabase direct connections without custom certs
  // },
});

pool.on('connect', () => {
  console.log('Database pool connected');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle(pool, { schema });

console.log("server/db.ts: Drizzle ORM client initialized for Supabase (node-postgres).");