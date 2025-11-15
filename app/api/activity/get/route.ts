import { NextResponse } from "next/server";

import { fetchActivityMetadata } from "@/lib/server/fetchActivityMetadata";
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

    // 3. Use server helper (source of truth)
    const activity = await fetchActivityMetadata(
      supabase,
      user.id,
      activityId
    );

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ activity });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
