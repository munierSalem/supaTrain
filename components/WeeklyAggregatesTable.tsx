'use client';

import './ActivityTable.css';
import { useWeeklyAggregates } from '@/hooks/useWeeklyAggregates';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

export default function WeeklyAggregatesTable() {
  const { data, loading, error } = useWeeklyAggregates(26);

  if (loading) return <p>Loading weekly summary…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data.length) return <p>No data yet.</p>;

  return (
    <table className="stats-table weekly-table">
      <thead>
        <tr>
          <th>Week</th>
          <th>Activities</th>
          <th>Time</th>
          <th>Dist (mi)</th>
          <th>Vert (ft)</th>
          <th>Avg HR</th>
          <th>Max HR</th>
        </tr>
      </thead>
      <tbody>
        {data.map((w) => (
          <tr key={w.week_start}>
            <td>
              {new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(w.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </td>
            <td>{w.activities}</td>
            <td>{formatTime(w.moving_time)}</td>
            <td>{(w.distance / 1609.34).toFixed(1)}</td>
            <td>{formatNumber(Math.round(w.total_elevation_gain * 3.28084))}</td>
            <td>{w.average_heartrate ?? '–'}</td>
            <td>{w.max_heartrate ?? '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
