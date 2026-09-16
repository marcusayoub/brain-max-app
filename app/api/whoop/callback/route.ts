import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WHOOP_TOKEN_URL } from "@/lib/whoop/config";

type WhoopTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const storedState = request.cookies.get("whoop_oauth_state")?.value;

  function fail(reason: string) {
    const res = NextResponse.redirect(
      `${origin}/meditation?whoop=error&reason=${reason}`,
    );
    res.cookies.delete("whoop_oauth_state");
    return res;
  }

  if (!code || !returnedState || !storedState || returnedState !== storedState) {
    return fail("state_mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return fail("not_configured");
  }

  const tokenRes = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return fail("token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as WhoopTokenResponse;

  const admin = createAdminClient();
  const { error } = await admin.from("whoop_connections").upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return fail("storage_failed");
  }

  const response = NextResponse.redirect(`${origin}/meditation?whoop=connected`);
  response.cookies.delete("whoop_oauth_state");
  return response;
}
