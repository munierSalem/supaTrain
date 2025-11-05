import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/', req.url));

  const supabase = getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/?error=no-user', req.url));

  // Exchange code → token
  const tokenResp = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResp.ok) {
    console.error('Strava token exchange failed', await tokenResp.text());
    return NextResponse.redirect(new URL('/?error=strava-auth-failed', req.url));
  }

  const tokenData = await tokenResp.json();

  // Upsert connection record
  const { error } = await supabase.from('user_connections').upsert(
    {
      user_id: user.id,
      provider: 'strava',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      athlete_id: tokenData.athlete.id,
      scope: tokenData.scope,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' } // ensures one per user/provider pair
  );

  if (error) {
    console.error('Supabase insert failed:', error);
    return NextResponse.redirect(new URL('/?error=db-upsert', req.url));
  }

  return NextResponse.redirect(new URL('/?connected=strava', req.url));
}
