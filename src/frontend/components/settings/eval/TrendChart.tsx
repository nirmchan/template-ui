import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { EvalTrendsResponse } from './eval-types';
import { friendlyMetricName, formatDate } from './eval-utils';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface TrendChartProps {
  data: EvalTrendsResponse;
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data.overall || data.overall.length < 2) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Score Trends
        </p>
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need at least 2 eval runs to show trends.
          </p>
        </div>
      </div>
    );
  }

  const metricKeys = Object.keys(data.metrics);

  const dateMap = new Map<string, Record<string, number>>();

  for (const point of [...data.overall].reverse()) {
    const label = formatDate(point.completed_at);
    if (!dateMap.has(label)) dateMap.set(label, {});
    dateMap.get(label)!['Overall'] = Math.round(point.eval_score * 100);
  }

  for (const [metric, points] of Object.entries(data.metrics)) {
    const friendly = friendlyMetricName(metric);
    for (const point of [...points].reverse()) {
      const label = formatDate(point.completed_at);
      if (!dateMap.has(label)) dateMap.set(label, {});
      if (point.pass_rate != null) {
        dateMap.get(label)![friendly] = Math.round(point.pass_rate * 100);
      }
    }
  }

  const chartData = Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

  const allKeys = [
    'Overall',
    ...metricKeys.map((k) => friendlyMetricName(k)),
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Score Trends
      </p>
      <div className="rounded-lg border border-border bg-card p-3">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
              }}
              formatter={(value: number) => [`${value}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            {allKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.08}
                strokeWidth={key === 'Overall' ? 2.5 : 1.5}
                strokeDasharray={key === 'Overall' ? '6 3' : undefined}
                dot={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
