'use client';

import './ActivityTable.css';
import { useActivities } from '@/hooks/useActivities';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
}

export default function ActivityTable() {
  const { activities, loading, error } = useActivities();

  if (loading) return <p>Loading activities...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!activities.length) return <p>No activities found.</p>;

  let prevWeek: string | null = null;

  return (
    <table className="stats-table activity-table">
      <thead>
        <tr>
          <th></th>
          <th className="border-right">Date</th>
          <th className="border-right">Sport</th>
          <th>Moving Time</th>
          <th>Dist (mi)</th>
          <th>Vert (ft)</th>
          <th  className="border-right">Max Elvt'n (ft)</th>
          <th>Avg HR (bpm)</th>
          <th>Max HR (bpm)</th>
        </tr>
      </thead>
      <tbody>
        {activities.map((a) => {
          const isNewWeek = a.weekKey !== prevWeek;
          prevWeek = a.weekKey;

          return (
            <tr
              key={a.activity_id}
              className={`activity-row ${isNewWeek ? 'new-week' : ''}`}
              data-week={a.weekKey}
              onClick={() => window.open(`https://www.strava.com/activities/${a.activity_id}`, '_blank')}
            >
              <td>
                {new Date(a.start_date).toLocaleDateString(undefined, {
                  weekday: 'short'
                })}
              </td>
              <td className="border-right">
                {new Date(a.start_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="border-right">{a.sport_type}</td>
              <td>{formatDuration(a.moving_time)}</td>
              <td>{(a.distance / 1000 * 0.621371).toFixed(1)}</td>
              <td>{Math.round(a.total_elevation_gain * 3.28084).toLocaleString()}</td>
              <td  className="border-right">{Math.round(a.elev_high * 3.28084).toLocaleString()}</td>
              <td>{(a.has_heartrate ? a.average_heartrate.toFixed(0) : '')}</td>
              <td>{(a.has_heartrate ? a.max_heartrate.toFixed(0) : '')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
