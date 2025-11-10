'use client';

import { getBrowserClient } from '@/lib/supabaseBrowser';
import { useEffect, useState } from 'react';
import ActivityTable from '@/components/ActivityTable';
import WeeklyAggregates from '@/components/weekly/WeeklyAggregates';

export default function Home() {
  const supabase = getBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [hasStrava, setHasStrava] = useState<boolean | null>(null);

  useEffect(() => {
    // Watch auth state
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUser(u ?? null);

      if (u) {
        // Check whether this user already has a Strava connection
        const { data: connections, error } = await supabase
          .from('user_connections')
          .select('id')
          .eq('user_id', u.id)
          .eq('provider', 'strava')
          .maybeSingle();

        if (error) {
          console.error('Error checking Strava connection:', error);
          setHasStrava(false);
        } else {
          setHasStrava(!!connections);
        }
      } else {
        setHasStrava(null);
      }
    };

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) setHasStrava(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const connectStrava = async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = encodeURIComponent('http://localhost:3000/strava/callback');
    const scope = encodeURIComponent('activity:read_all,profile:read_all');
    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${userId}`;
    window.location.href = url;
  };

  const updateActivities = () => {
    window.location.href = '/activities/update';
  };

  const addActivity = () => {
    window.location.href = '/add';
  };

  return (
    <>
      {user && hasStrava === false && (
        <>
          <h2>Welcome to supaTrain</h2>
          <div style={{ marginTop: '2rem' }}>
            <h3>Connect your Strava account</h3>
            <p>Authorize Strava so we can import your workouts automatically.</p>
            <button onClick={connectStrava}>Connect Strava</button>
          </div>
        </>
      )}

      {user && hasStrava === true && (
        <>
          <h2>Recent Activities</h2>
          <button onClick={updateActivities}>Update Activities</button>
          <button onClick={addActivity} style={{ marginLeft: '1rem' }}>
            Add Manual Activity
          </button>
          <WeeklyAggregates />
          <ActivityTable />
        </>
      )}
    </>
  );
}
