// app/api/health-metrics/upsert-max-heartrate/route.ts

import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ max_heartrate: null });

  // get most recent max_heartrate as-of today
  const { data, error } = await supabase
    .from("user_health_metrics")
    .select("metric_value")
    .eq("user_id", user.id)
    .eq("metric_name", "max_heartrate")
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    max_heartrate: data?.metric_value ?? null,
  });
}

export async function POST(req: Request) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { max_heartrate } = await req.json();

  if (!max_heartrate || isNaN(max_heartrate)) {
    return NextResponse.json({ error: "Invalid max_heartrate" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  // upsert rule: (user_id, metric_name, effective_date) uniqueness
  const { error } = await supabase.from("user_health_metrics").upsert(
    {
      user_id: user.id,
      metric_name: "max_heartrate",
      metric_value: max_heartrate,
      effective_date: today,
    },
    {
      onConflict: "user_id,metric_name,effective_date",
    }
  );

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
