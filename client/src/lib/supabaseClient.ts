// client/src/lib/supabaseClient.ts
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

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

// Construct the correct WSS URL from the HTTPS Supabase URL
// const wssUrl = supabaseUrl.replace(/^http/, 'ws'); // Not used in this version of the hack

// Experimental: Custom WebSocket class to intercept and log/modify URL
// We will try to assign this to window to see if Supabase picks it up.
class CustomWebSocketLogger extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    console.log(`[CustomWebSocketLogger] Attempting to construct WebSocket with URL: ${url}`);
    // We won't modify the URL here, just log its attempted use.
    // If Supabase is calling this with 'ws://localhost:undefined', this log will prove it.
    super(url, protocols);
    console.log(`[CustomWebSocketLogger] Constructed WebSocket with URL: ${this.url}`);
  }
}

// HACK: Globally replace WebSocket for diagnosis.
// This is dangerous and only for temporary debugging to see what Supabase is doing.
// Ensure this is reverted after testing.
if (typeof window !== 'undefined') {
  console.warn("[SupabaseClient] HACK: Globally replacing window.WebSocket with CustomWebSocketLogger for diagnosis.");
  (window as any).OriginalWebSocket = WebSocket; // Store original
  (window as any).WebSocket = CustomWebSocketLogger;
}


const clientOptions: SupabaseClientOptions<"public"> = {
  global: {
    headers: {
      // Optionally set default fetch headers here
    }
  },
  auth: {
    // autoRefreshToken: true, // Default
    // persistSession: true, // Default
    // detectSessionInUrl: true, // Default
  },
  realtime: {
    // We keep this minimal, as the global WebSocket override is the main test
    params: {
       eventsPerSecond: 10, // Default is 10
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

console.log('[SupabaseClient] Supabase client instance created:', supabase);
if (supabase && supabase.realtime) {
  console.log('[SupabaseClient] Supabase realtime client object:', supabase.realtime);
} else if (supabase) {
  console.log('[SupabaseClient] Supabase client instance does not have a realtime property or it is null/undefined.');
} else {
  console.log('[SupabaseClient] Supabase client instance is null or undefined after createClient call.');
}

// To revert the hack if needed (e.g., in a cleanup function or manually in console):
// if (typeof window !== 'undefined' && (window as any).OriginalWebSocket) {
//   console.warn("[SupabaseClient] HACK: Reverting window.WebSocket to original.");
//   (window as any).WebSocket = (window as any).OriginalWebSocket;
// }