import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state"); // passed from frontend (Supabase user.id)

    if (!code || !userId) {
      console.error("❌ Missing code or userId in state");
      return NextResponse.redirect(new URL("/?error=missing_params", req.url));
    }

    // Step 1: Exchange code → token with Strava
    const tokenResp = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error("❌ Strava token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/?error=strava_exchange_failed", req.url)
      );
    }

    // Step 2: Initialize Supabase client using service-role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 3: Upsert the Strava connection
    const { error } = await supabase.from("user_connections").upsert({
      user_id: userId,
      provider: "strava",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      athlete_id: tokenData.athlete?.id ?? null,
      scope: tokenData.scope ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.redirect(new URL("/?error=db_error", req.url));
    }

    console.log("✅ Strava connection saved for user:", userId);

    // Step 4: Redirect home
    return NextResponse.redirect(new URL("/?connected=strava", req.url));
  } catch (err) {
    console.error("🔥 Unhandled error in /strava/callback:", err);
    return NextResponse.redirect(new URL("/?error=server_error", req.url));
  }
}
