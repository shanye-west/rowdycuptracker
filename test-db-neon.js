// test-db-neon.js
import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

console.log('Testing Neon database connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');

async function testNeonConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('Make sure your .env file contains:');
    console.error('DATABASE_URL=postgresql://username:password@host/database');
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result[0]?.current_time);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testNeonConnection();