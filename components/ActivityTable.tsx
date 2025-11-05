'use client';

import { useActivities } from '@/hooks/useActivities';

export default function ActivityTable() {
  const { activities, loading, error } = useActivities();

  if (loading) return <p>Loading activities...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!activities.length) return <p>No activities found.</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '0.5rem' }}>Date</th>
          <th style={{ padding: '0.5rem' }}>Sport</th>
          <th style={{ padding: '0.5rem' }}>Distance (km)</th>
          <th style={{ padding: '0.5rem' }}>Moving Time (min)</th>
        </tr>
      </thead>
      <tbody>
        {activities.map((a) => (
          <tr key={a.activity_id} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '0.5rem' }}>
              {new Date(a.start_date).toLocaleDateString()}
            </td>
            <td style={{ padding: '0.5rem' }}>{a.sport_type}</td>
            <td style={{ padding: '0.5rem' }}>
              {(a.distance / 1000).toFixed(1)}
            </td>
            <td style={{ padding: '0.5rem' }}>
              {(a.moving_time / 60).toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
