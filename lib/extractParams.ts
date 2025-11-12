// /lib/extractParam.ts
export function extractActivityId(req: Request): number {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("id");
  if (!rawId) throw new Error("Missing activity ID");

  const activityId = Number(rawId);
  if (!Number.isSafeInteger(activityId) || activityId <= 0)
    throw new Error(`Invalid activity ID: ${rawId}`);

  return activityId;
}
