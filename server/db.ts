// server/db.ts
import dotenv from 'dotenv';

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to add it to your .env file?"
  );
}

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });