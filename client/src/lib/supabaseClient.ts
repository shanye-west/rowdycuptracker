// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[SupabaseClient] Initial VITE_SUPABASE_URL:', supabaseUrl);
console.log('[SupabaseClient] Initial VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Exists and is non-empty' : 'MISSING or empty');


if (!supabaseUrl || !supabaseAnonKey) {
  let message = "Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file (and prefixed with VITE_ for client-side access).";
  message += `\nSupabase URL found: ${supabaseUrl ? 'Yes' : 'No'}`;
  message += `\nSupabase Anon Key found: ${supabaseAnonKey ? 'Yes' : 'No'}`;
  console.error('[SupabaseClient] ERROR:', message);
  throw new Error(message);
}

console.log('[SupabaseClient] Values being passed to createClient:');
console.log('[SupabaseClient]   URL:', supabaseUrl);
console.log('[SupabaseClient]   Anon Key:', supabaseAnonKey ? 'Exists and is non-empty' : 'MISSING or empty');


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // Optionally set default fetch headers here
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 0 // Setting to 0 to effectively disable or minimize activity
    }
  }
});

console.log('[SupabaseClient] Supabase client instance created:', supabase);
if (supabase && supabase.realtime) {
  console.log('[SupabaseClient] Supabase realtime client object:', supabase.realtime);
} else if (supabase) {
  console.log('[SupabaseClient] Supabase client instance does not have a realtime property or it is null/undefined.');
} else {
  console.log('[SupabaseClient] Supabase client instance is null or undefined after createClient call.');
}