import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WHOOP_REVOKE_URL } from "@/lib/whoop/config";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("whoop_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connection?.access_token) {
    try {
      await fetch(WHOOP_REVOKE_URL, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${connection.access_token}` },
      });
    } catch {
      // Best-effort — we still delete our stored tokens below either way,
      // so the app stops using them even if WHOOP's revoke call fails.
    }
  }

  const { error } = await admin
    .from("whoop_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ disconnected: true });
}
