import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("whoop_connections")
    .select("created_at, scope")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    connected: !!data,
    connectedAt: data?.created_at ?? null,
    scope: data?.scope ?? null,
  });
}
