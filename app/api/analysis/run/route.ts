import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { spawn } from "child_process";

/**
 * Run an activity's stream data analysis via Python
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

    // 🐍 Run the Python script (blocking, but fine for short analyses)
    const py = spawn("python3", [
      "python/scripts/derive_metrics.py",
      activityId,
      user.id,
    ]);

    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    py.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    const exitCode: number = await new Promise((resolve) =>
      py.on("close", resolve)
    );

    if (exitCode !== 0) {
      throw new Error(`Python exited ${exitCode}: ${stderr || stdout}`);
    }

    let analysisJson: any;
    try {
      analysisJson = JSON.parse(stdout.trim());
    } catch {
      throw new Error(
        `Invalid JSON from Python for activity ${activityId}: ${stdout.slice(
          0,
          200
        )}`
      );
    }

    // 🗄️ Update existing activity_data row with metrics
    const { error: upsertErr } = await supabase
      .from("activity_data")
      .update({
        analyzed_at: analysisJson.analyzed_at,
        uphill_heartrate: analysisJson.uphill_heartrate,
        downhill_heartrate: analysisJson.downhill_heartrate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("activity_id", Number(activityId));

    if (upsertErr) throw new Error(`DB update failed: ${upsertErr.message}`);

    console.log(`✅ Saved stream analysis for activity ${activityId}`);
    return NextResponse.json({ ok: true, activity_id: activityId });
  } catch (err: any) {
    console.error("❌ Stream analysis failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
