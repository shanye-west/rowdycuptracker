// client/src/lib/supabaseClient.ts
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('[SupabaseClient] Initializing...');
console.log('[SupabaseClient] VITE_SUPABASE_URL from import.meta.env:', import.meta.env.VITE_SUPABASE_URL);
console.log('[SupabaseClient] VITE_SUPABASE_ANON_KEY from import.meta.env:', import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl) {
  console.error('[SupabaseClient] FATAL: VITE_SUPABASE_URL is not defined. Ensure it is set in your .env file.');
}
if (!supabaseAnonKey) {
  console.error('[SupabaseClient] FATAL: VITE_SUPABASE_ANON_KEY is not defined. Ensure it is set in your .env file.');
}
console.log('[SupabaseClient] Using URL for createClient:', supabaseUrl);
console.log('[SupabaseClient] Using Anon Key for createClient:', supabaseAnonKey ? 'Exists' : 'MISSING or empty');

const clientOptions: SupabaseClientOptions<"public"> = {
  // Attempt to disable realtime by not providing a realtime schema or by specific options if available
  // Forcibly override the realtime URL to something invalid to see if it changes the error,
  // or to see if the localhost:undefined error still persists, indicating it's not from this config.
  // However, the RealtimeClientOptions doesn't directly allow disabling it, only configuring it.
  // We will pass an empty object for realtime to see if it has an effect or defaults sanely.
  realtime: {} // Pass an empty object for realtime options
};

// Initialize Supabase client with modified options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

console.log('[SupabaseClient] Supabase client instance created (attempting to modify/disable realtime behavior).');
if (supabase) {
  console.log('[SupabaseClient]   URL:', supabaseUrl); // supabase.supabaseUrl is not a public property
  console.log('[SupabaseClient]   Anon Key:', supabaseAnonKey ? 'Exists and is non-empty' : 'MISSING or empty'); // supabase.supabaseKey is not public
}

if (supabase && supabase.realtime) {
  console.log('[SupabaseClient] Supabase realtime client object:', supabase.realtime);
  // supabase.realtime.connect(); // Avoid explicitly calling connect here unless necessary
  // console.log('[SupabaseClient] Supabase realtime status:', supabase.realtime.status);
} else if (supabase) {
  console.log('[SupabaseClient] Supabase client instance exists, but supabase.realtime is not available.');
} else {
  console.log('[SupabaseClient] Supabase client instance is null or undefined after createClient call.');
}