'use client';

import './weekly-aggregates.css';
import { useWeeklyAggregates } from '@/hooks/useWeeklyAggregates';
import WeeklyAggregatesTable from './WeeklyAggregatesTable';
import WeeklyAggregatesChart from './WeeklyAggregatesChart';

export default function WeeklyAggregates() {
  const { data, loading, error } = useWeeklyAggregates(26);

  if (loading) return <p>Loading weekly summary…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data?.length) return <p>No data yet.</p>;

  return (
    <section className="weekly-aggregates">
      <div className="weekly-aggregates__table">
        <WeeklyAggregatesTable data={data} />
      </div>
      <div className="weekly-aggregates__chart">
        <WeeklyAggregatesChart data={data} />
      </div>
    </section>
  );
}
