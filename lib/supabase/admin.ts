import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the Supabase service-role key, which bypasses row
// level security entirely. Never import this from a "use client" file,
// never send its output to the browser, and never log the key itself.
// Reserved for the handful of places (WHOOP token storage/refresh,
// webhook processing, the reconciliation cron) where the app needs to
// read/write on a user's behalf without an active browser session.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
