// lib/strava.ts
export async function getValidStravaAccessToken(supabase: any, userId: string) {
  const { data: conn, error: connErr } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "strava")
    .maybeSingle();

  if (connErr || !conn) throw new Error("No Strava connection found");

  let accessToken = conn.access_token;

  // refresh if expired
  if (new Date(conn.expires_at) < new Date()) {
    const resp = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

    accessToken = data.access_token;

    await supabase
      .from("user_connections")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conn.id);
  }

  return accessToken;
}

export async function fetchRecentStravaActivities(accessToken: string, perPage = 50) {
  const resp = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Strava fetch failed: ${JSON.stringify(data)}`);
  return data;
}
