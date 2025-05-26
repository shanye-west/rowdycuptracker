// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  let message = "Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (and prefixed with VITE_ for client-side access).";
  message += `\nSupabase URL found: ${supabaseUrl ? 'Yes' : 'No'}`;
  message += `\nSupabase Anon Key found: ${supabaseAnonKey ? 'Yes' : 'No'}`;
  console.error(message);
  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // Optionally set default fetch headers here
    }
  }
  // Removed 'realtime' option as 'enabled' is not a valid property
});