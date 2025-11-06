'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export interface WeeklyAggregate {
  week_start: string;
  week_end: string;
  iso_week: string;
  activities: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate: number | null;
  max_heartrate: number | null;
}

export function useWeeklyAggregates(limit = 20) {
  const [data, setData] = useState<WeeklyAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();

    async function fetchData() {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError('Not signed in');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('weekly_aggregates')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(limit);

      if (error) setError(error.message);
      else setData((data ?? []) as WeeklyAggregate[]);

      setLoading(false);
    }

    fetchData();
  }, [limit]);

  return { data, loading, error };
}
