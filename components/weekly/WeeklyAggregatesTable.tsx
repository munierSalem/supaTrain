'use client';

import './weekly-aggregates.css';
import '@/components/ActivityTable.css';
import type { WeeklyAggregate } from '@/hooks/useWeeklyAggregates';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
const fmtInt = (n: number) => n.toLocaleString('en-US');

type Props = { data: WeeklyAggregate[] };

export default function WeeklyAggregatesTable({ data }: Props) {
  return (
    <div className="weekly-table-container">
      <table className="stats-table weekly-table">
        <thead>
          <tr>
            <th>Week</th>
            <th>Activities</th>
            <th>Time</th>
            <th>Dist (mi)</th>
            <th>Vert (ft)</th>
            <th>Avg HR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((w) => (
            <tr key={w.week_start}>
              <td>{new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
              <td>{w.activities}</td>
              <td>{formatTime(w.moving_time)}</td>
              <td>{(w.distance / 1609.34).toFixed(1)}</td>
              <td>{fmtInt(Math.round(w.total_elevation_gain * 3.28084))}</td>
              <td>{w.average_heartrate == null ? '–' : Math.round(w.average_heartrate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
