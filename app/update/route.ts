import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const supabase = await getServerClient();

  // 1️⃣ Verify user session
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.error("Unauthorized:", userErr);
    return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
  }

  // 2️⃣ Fetch Strava connection for this user
  const { data: conn, error: connErr } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "strava")
    .maybeSingle();

  if (connErr || !conn) {
    console.error("No Strava connection found:", connErr);
    return NextResponse.redirect(new URL("/?error=no_strava_connection", req.url));
  }

  let accessToken = conn.access_token;

  // 3️⃣ Refresh if expired
  if (new Date(conn.expires_at) < new Date()) {
    console.log("Refreshing Strava token…");
    const tokenResp = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error("Token refresh failed:", tokenData);
      return NextResponse.redirect(new URL("/?error=refresh_failed", req.url));
    }

    accessToken = tokenData.access_token;

    // Update DB with new tokens
    await supabase
      .from("user_connections")
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conn.id);
  }

  // 4️⃣ Fetch latest activities from Strava
  const activitiesResp = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=50",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const activities = await activitiesResp.json();

  if (!activitiesResp.ok) {
    console.error("Strava fetch failed:", activities);
    return NextResponse.redirect(new URL("/?error=strava_fetch_failed", req.url));
  }

  // 5️⃣ Prep Data for input to DB
  const rows = activities.map((a: any) => ({
    activity_id: a?.id ?? null,
    user_id: user.id,
    source: "strava",

    resource_state: a?.resource_state ?? null,
    athlete: a?.athlete ?? null,                           // jsonb
    name: a?.name ?? null,
    distance: a?.distance ?? null,
    moving_time: a?.moving_time ?? null,
    elapsed_time: a?.elapsed_time ?? null,
    total_elevation_gain: a?.total_elevation_gain ?? null,
    type: a?.type ?? null,
    sport_type: a?.sport_type ?? null,
    workout_type: a?.workout_type ?? null,
    device_name: a?.device_name ?? null,

    // timestamps (DB expects timestamptz)
    start_date: a?.start_date ? new Date(a.start_date).toISOString() : null,
    start_date_local: a?.start_date_local ? new Date(a.start_date_local).toISOString() : null,

    timezone: a?.timezone ?? null,
    utc_offset: a?.utc_offset ?? null,

    location_city: a?.location_city ?? null,
    location_state: a?.location_state ?? null,
    location_country: a?.location_country ?? null,

    achievement_count: a?.achievement_count ?? null,
    kudos_count: a?.kudos_count ?? null,
    comment_count: a?.comment_count ?? null,
    athlete_count: a?.athlete_count ?? null,
    photo_count: a?.photo_count ?? null,

    map: a?.map ?? null,                                   // jsonb (id, summary_polyline)
    trainer: a?.trainer ?? null,
    commute: a?.commute ?? null,
    manual: a?.manual ?? null,
    private: a?.private ?? null,
    visibility: a?.visibility ?? null,
    flagged: a?.flagged ?? null,
    gear_id: a?.gear_id ?? null,

    start_latlng: a?.start_latlng ? JSON.parse(JSON.stringify(a.start_latlng)) : null, // jsonb
    end_latlng: a?.end_latlng ? JSON.parse(JSON.stringify(a.end_latlng)) : null,       // jsonb

    average_speed: a?.average_speed ?? null,
    max_speed: a?.max_speed ?? null,

    has_heartrate: a?.has_heartrate ?? null,
    average_heartrate: a?.average_heartrate ?? null,
    max_heartrate: a?.max_heartrate ?? null,
    heartrate_opt_out: a?.heartrate_opt_out ?? null,
    display_hide_heartrate_option: a?.display_hide_heartrate_option ?? null,

    elev_high: a?.elev_high ?? null,
    elev_low: a?.elev_low ?? null,

    upload_id: a?.upload_id ?? null,
    upload_id_str: a?.upload_id_str ?? null,
    external_id: a?.external_id ?? null,
    from_accepted_tag: a?.from_accepted_tag ?? null,

    pr_count: a?.pr_count ?? null,
    total_photo_count: a?.total_photo_count ?? null,
    has_kudoed: a?.has_kudoed ?? null,

    average_cadence: a?.average_cadence ?? null,
    average_watts: a?.average_watts ?? null,
    max_watts: a?.max_watts ?? null,
    weighted_average_watts: a?.weighted_average_watts ?? null,
    device_watts: a?.device_watts ?? null,
    kilojoules: a?.kilojoules ?? null,
    // created_at uses DB default
  })).filter(r => r.activity_id !== null);

  if (!rows.length) {
    return NextResponse.redirect(new URL("/?updated=none", req.url));
  }

  // 6) Upsert by primary key (activity_id)
  const { error: upsertErr } = await supabase
    .from("activities")
    .upsert(rows, { onConflict: "activity_id" });

  if (upsertErr) {
    console.error("DB upsert error:", upsertErr);
    return NextResponse.redirect(new URL("/?error=db_insert_failed", req.url));
  }

  console.log(`✅ Upserted ${rows.length} activities for ${user.email}`);
  return NextResponse.redirect(new URL("/?updated=true", req.url));
}
