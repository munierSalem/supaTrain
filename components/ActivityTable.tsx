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
    <table className="activity-table">
      <thead>
        <tr>
          <th></th>
          <th>Date</th>
          <th>Sport</th>
          <th>Moving Time</th>
          <th>Distance (mi)</th>
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
            >
              <td>
                {new Date(a.start_date).toLocaleDateString(undefined, {
                  weekday: 'short'
                })}
              </td>
              <td>
                {new Date(a.start_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td>{a.sport_type}</td>
              <td>{formatDuration(a.moving_time)}</td>
              <td>{(a.distance / 1000 * 0.621371).toFixed(1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
