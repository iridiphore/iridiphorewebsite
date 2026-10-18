import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "").trim();
const KEY = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "").trim();

/** False while the backend hasn't been set up: the site then shows sample content. */
export const backendConfigured = URL !== "" && KEY !== "";

export const supabase: SupabaseClient | null = backendConfigured
  ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
