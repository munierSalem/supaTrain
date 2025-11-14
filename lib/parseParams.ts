export function parseActivityId(req: Request): number {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("id");
  if (!rawId) throw new Error("Missing activity ID");

  const activityId = Number(rawId);
  if (!Number.isSafeInteger(activityId) || activityId <= 0)
    throw new Error(`Invalid activity ID: ${rawId}`);

  return activityId;
}


/**
 * Parse an optional "asOf" date parameter from the URL.
 *
 * - Returns null if param is missing.
 * - Ensures strict YYYY-MM-DD format.
 * - Throws on invalid values.
 */
export function parseAsOfDate(req: Request): string | null {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("asOf");

  // No value → indicates "current"
  if (!raw) return null;

  // Strict date format: YYYY-MM-DD
  const validFormat = /^\d{4}-\d{2}-\d{2}$/;
  if (!validFormat.test(raw)) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): "${raw}"`);
  }

  // Additional safety: ensure it is a real date
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid calendar date: "${raw}"`);
  }

  // It’s a valid date string
  return raw;
}
