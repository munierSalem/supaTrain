import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { parseActivityId } from "@/lib/parseParams";

export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();

    // 1. Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse activity_id from ?id=123
    const activityId = parseActivityId(req);

    // 3. Query the enriched view
    const { data, error } = await supabase
      .from("activities_enriched")
      .select("*")
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching activity:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity: data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
