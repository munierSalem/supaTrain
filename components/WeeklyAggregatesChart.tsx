'use client';
import '@/lib/d3/d3-plot.css';
import { useEffect } from 'react';
import * as d3 from 'd3'; // ensure d3 is available globally for D3Plot
import { BarChart } from '@/lib/d3/BarChart';
import { useWeeklyAggregates } from '@/hooks/useWeeklyAggregates';
import { formatHHMMSS, hr } from '@/utils/formatters';

export default function WeeklyAggregatesChart() {
  const { data, loading } = useWeeklyAggregates();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Prepare data for chart:
    // label: 'Nov 3' (week_start), y: hours = moving_time / 3600
    const rows = data
      .slice() // shallow copy so we can reverse without mutating
      .reverse() // oldest → newest if you prefer
      .map(d => ({
        label: d3.timeFormat('%b %-d')(new Date(d.week_start)),
        hours: (d.moving_time ?? 0) / 3600,
        // keep raw fields for tooltip
        moving_time: d.moving_time ?? 0,
        distance: d.distance ?? 0,
        average_heartrate: d.average_heartrate,
      }));

    const chart = new BarChart({
      containerId: 'weekly-agg-chart',
      data: rows,
      xField: 'label',
      yField: 'hours',
      width: 900,
      height: 300,
      xAxisArgs: { ticks: rows.length, label: '' },
      yAxisArgs: { ticks: 5, label: 'Hours' },
      tooltipArgs: {
        text: (r) => `
          <div style="font-weight:600">${r.label}</div>
          <div>Moving time: ${formatHHMMSS(r.moving_time)}</div>
          <div>Distance: ${(r.distance / 1609.344).toFixed(1)} mi</div>
          <div>Avg HR: ${hr(r.average_heartrate)} bpm</div>
        `,
      },
    });

    chart.updatePlot(); // render

    return () => {
      // Optional: clean up container contents on unmount
      const el = document.getElementById('weekly-agg-chart');
      if (el) el.innerHTML = '';
    };
  }, [data]);

  return (
    <div id="weekly-agg-chart" />
  );
}
