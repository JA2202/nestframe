// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side / browser usage: auth, simple queries
export const supabaseBrowser = () =>
  createClient(url, anonKey);

// Server-side admin usage: API routes, workers
export const supabaseAdmin = () =>
  createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
