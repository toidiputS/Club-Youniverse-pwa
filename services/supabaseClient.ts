/**
 * @file Initializes and exports the Supabase client.
 * This file centralizes the Supabase configuration, making it easy to use the client
 * across the application for authentication and database interactions.
 */

import { createClient } from '@supabase/supabase-js';

// Vercel and other hosting providers inject environment variables.
// Vite requires the 'VITE_' prefix to expose variables to the client-side code.
// Use optional chaining to guard against runtime environments where import.meta.env might be undefined.

// Use fallback object to prevent crash if import.meta.env is undefined.
const env = import.meta.env || ({} as any);

// Use environment variables if they are available, otherwise fall back to the user's project ID.
const supabaseUrl = env.VITE_SUPABASE_URL || "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

// The Supabase client is now guaranteed to be created.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);