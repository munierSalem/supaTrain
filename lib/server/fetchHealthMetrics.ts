export async function fetchHealthMetrics(
  supabase: any,
  userId: string,
  asOf: string
) {
  const { data, error } = await supabase.rpc(
    "get_user_health_metrics_as_of",
    {
      p_user_id: userId,
      p_as_of_date: asOf,
    }
  );

  if (error) {
    console.error("Error fetching health metrics:", error);
    return {};
  }

  return data; // already a dict
}
