'use client';
import '@/lib/d3/d3-plot.css';
import './weekly-aggregates.css';

import { useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart } from '@/lib/d3/BarChart';
import { formatHHMMSS, hr } from '@/utils/formatters';
import type { WeeklyAggregate } from '@/hooks/useWeeklyAggregates';

type Props = { data: WeeklyAggregate[] };

export default function WeeklyAggregatesChart({ data }: Props) {
  useEffect(() => {
    if (!data || data.length === 0) return;

    const rows = data
      .slice()
      .reverse()
      .map(d => ({
        label: d3.timeFormat('%b %-d')(new Date(d.week_start)),
        hours: (d.moving_time ?? 0) / 3600,
        moving_time: d.moving_time ?? 0,
        distance: d.distance ?? 0,
        average_heartrate: d.average_heartrate,
      }));

    const chart = new BarChart({
      containerId: 'weekly-agg-chart',
      data: rows,
      xField: 'label',
      yField: 'hours',
      width: 450,
      height: 320,
      xAxisArgs: { ticks: rows.length, label: 'Week' },
      yAxisArgs: { ticks: 5, label: 'Hours' },
      tooltipArgs: {
        text: (r) => `
          <h3>${r.label}</h3>
          <div><strong>Moving time:</strong> ${formatHHMMSS(r.moving_time)}</div>
          <div><strong>Distance:</strong> ${(r.distance / 1609.344).toFixed(1)} mi</div>
          <div><strong>Avg HR:</strong> ${hr(r.average_heartrate)} bpm</div>
        `,
      },
    });

    chart.updatePlot();

    return () => {
      const el = document.getElementById('weekly-agg-chart');
      if (el) el.innerHTML = '';
    };
  }, [data]);

  return <div id="weekly-agg-chart" />;
}
