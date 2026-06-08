import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY. Bypasses RLS. Used by /api routes
// that Make calls. Never import this into a client component.
// Lazily instantiated so `next build` doesn't construct it without env vars.
let _admin: SupabaseClient | null = null;

export function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  return _admin;
}
