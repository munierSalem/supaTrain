import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { getValidStravaAccessToken, fetchRecentStravaActivities } from "@/lib/strava";

export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const accessToken = await getValidStravaAccessToken(supabase, user.id);
    const activities = await fetchRecentStravaActivities(accessToken, 50);

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
    }));

    const validRows = rows.filter(r => r.activity_id);
    if (!validRows.length) return NextResponse.json({ updated: 0 });

    const { error: upsertErr } = await supabase
      .from("activities")
      .upsert(validRows, { onConflict: "activity_id" });

    if (upsertErr) throw new Error(`DB upsert error: ${JSON.stringify(upsertErr)}`);

    return NextResponse.json({ updated: validRows.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
