import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Select activity_data rows missing analysis
    const { data, error } = await supabase
      .from("activity_data")
      .select("activity_id")
      .eq("user_id", user.id)
      .is("analyzed_at", null);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data?.map((r) => r.activity_id) ?? [] });
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
