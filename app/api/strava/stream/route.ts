import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { getValidStravaAccessToken } from "@/lib/strava";
import { saveStreamFile } from "@/lib/files";
import crypto from "crypto";

/**
 * Downloads an activity's stream data from Strava and saves it as JSON.
 */
export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();

    // 🔐 Verify user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    // 🆔 Extract ?id= param
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("id");
    if (!activityId) throw new Error("Missing activity ID");

    // 🔑 Get a valid Strava access token (refreshes if expired)
    const accessToken = await getValidStravaAccessToken(supabase, user.id);

    // 🛰️ Fetch Streams (the modern, supported export)
    const url = `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,time,altitude,heartrate,watts,temp&key_by_type=true`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error(`Failed to fetch streams for ${activityId}: ${errTxt}`);
    }

    // Read JSON content
    const streamJson = await resp.json();

    // 💾 Save the JSON to disk
    const streamString = JSON.stringify(streamJson, null, 2);

    // Compute checksum
    const checksum = crypto
      .createHash("sha256")
      .update(streamString)
      .digest("hex");

    // Save file
    const filePath = await saveStreamFile(
      user.id,
      Number(activityId),
      streamString
    );

    // 🗄️ Upsert into activity_data
    const { error: upsertErr } = await supabase.from("activity_data").upsert({
      activity_id: Number(activityId),
      user_id: user.id,
      source: "strava",
      stream_path: filePath,
      stream_downloaded_at: new Date().toISOString(),
      checksum_sha256: checksum,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) throw new Error(`DB upsert failed: ${upsertErr.message}`);

    console.log(
      `✅ Saved streams for activity ${activityId} (${streamJson?.latlng?.data?.length ?? 0
      } points)`
    );

    return NextResponse.json({ ok: true, activity_id: activityId });
  } catch (err: any) {
    console.error("❌ Stream download failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
