// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Ensure .env is loaded

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found in .env. Ensure it's set to your Supabase direct database connection string.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql", // Supabase is PostgreSQL
  dbCredentials: {
    url: process.env.DATABASE_URL, // This now points to your Supabase DB
  },
  // verbose: true, // Optional: for more detailed Drizzle Kit output
  // strict: true,  // Optional: for stricter checks
});