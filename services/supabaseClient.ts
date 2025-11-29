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

// Use environment variables if they are available, otherwise fall back to the public sample project.
// This allows the app to run out-of-the-box without requiring developers to create a .env.local file.
const supabaseUrl = env.VITE_SUPABASE_URL || "https://ksnjoyfsmbkvzqhpjhpr.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbmpveWZzbWJrdnpxaHBqaHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDIzNzYsImV4cCI6MjA3NzcxODM3Nn0.GZ8HiOnUgeMvkZfqewShAiHAQ26_IXqz3_qPALRu7pU";

// The Supabase client is now guaranteed to be created.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);