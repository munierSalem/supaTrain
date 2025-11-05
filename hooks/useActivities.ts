'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export interface Activity {
  activity_id: number;
  start_date: string;
  sport_type: string;
  distance: number;
  moving_time: number;
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();

    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError('Not signed in');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('activities')
        .select('activity_id, start_date, sport_type, distance, moving_time')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(20);

      if (error) setError(error.message);
      else setActivities(data ?? []);

      setLoading(false);
    }

    load();
  }, []);

  return { activities, loading, error };
}
