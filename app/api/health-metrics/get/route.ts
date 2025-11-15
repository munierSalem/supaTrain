import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabaseServer";
import { parseAsOfDate } from "@/lib/parseParams";


export async function GET(req: Request) {
  const supabase = await getServerClient();

  let asOf: string | null = null;
  try {
    asOf = parseAsOfDate(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ metrics: {} });
  }

  const args: Record<string, any> = {
    p_user_id: user.id,
  };

  if (asOf !== null) {
    args.p_as_of_date = asOf;
  }
  const { data, error } = await supabase.rpc(
    "get_user_health_metrics_as_of",
    args
  );

  if (error) {
    console.error(error);
    return NextResponse.json({ metrics: {} });
  }

  // `data` is already a JSON object from Postgres
  return NextResponse.json({ metrics: data ?? {} });
}
