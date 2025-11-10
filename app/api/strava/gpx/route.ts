import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { getValidStravaAccessToken } from "@/lib/strava";
import { saveGpxFile } from "@/lib/files";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    // get ?id= param
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("id");
    if (!activityId) throw new Error("Missing activity ID");

    // fetch user's Strava token
    const accessToken = await getValidStravaAccessToken(supabase, user.id);

    // 1️⃣ Download GPX from Strava
    const resp = await fetch(`https://www.strava.com/api/v3/activities/${activityId}/export_gpx`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error(`Failed to fetch GPX for ${activityId}: ${errTxt}`);
    }

    const gpxContents = await resp.text();

    // 2️⃣ Compute checksum
    const checksum = crypto.createHash("sha256").update(gpxContents).digest("hex");

    // 3️⃣ Save to disk (returns relative path)
    const gpxPath = await saveGpxFile(user.id, Number(activityId), gpxContents);

    // 4️⃣ Upsert into activity_data
    const { error: upsertErr } = await supabase.from("activity_data").upsert({
      activity_id: Number(activityId),
      user_id: user.id,
      source: "strava",
      gpx_path: gpxPath,
      gpx_downloaded_at: new Date().toISOString(),
      checksum_sha256: checksum,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw new Error(`DB upsert failed: ${upsertErr.message}`);

    return NextResponse.json({ ok: true, activity_id: activityId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
