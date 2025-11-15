export async function fetchActivityMetadata(
  supabase: any,
  userId: string,
  activityId: number
) {
  const { data, error } = await supabase
    .from("activities_enriched")
    .select("*")
    .eq("user_id", userId)
    .eq("activity_id", activityId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching activity metadata:", error);
    return null;
  }

  return data;
}
