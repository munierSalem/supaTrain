import { NextResponse } from "next/server";

import { fetchHealthMetrics } from "@/lib/server/fetchHealthMetrics";
import { parseAsOfDate } from "@/lib/parseParams";
import { getServerClient } from "@/lib/supabaseServer";


export async function GET(req: Request) {
  const supabase = await getServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ metrics: {} });
  }

  let asOf: string | null = null;
  try {
    asOf = parseAsOfDate(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const metrics = await fetchHealthMetrics(supabase, user.id, asOf);

  return NextResponse.json({ metrics });
}
