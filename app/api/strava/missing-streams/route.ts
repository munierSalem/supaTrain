// app/api/strava/missing-streams/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const supabase = await getServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("missing_streams")
    .select("activity_id")
    .eq("user_id", user.id)
    .eq("sport_type", "Hike") // FIXME
    .limit(5); // FIXME

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ missing: data?.map(r => r.activity_id) ?? [] });
}
