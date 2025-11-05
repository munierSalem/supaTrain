'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export interface Activity {
  activity_id: number;
  start_date: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  weekKey?: string; // e.g. "2025-W44"
}

// helper to compute ISO week key (Mon-Sun)
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  // ISO week: adjust to nearest Thursday
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0...Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNo = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
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
      else {
        const withWeeks = (data ?? []).map((a) => ({
          ...a,
          weekKey: getWeekKey(a.start_date),
        }));
        setActivities(withWeeks);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { activities, loading, error };
}
