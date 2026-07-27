import type { MetricStats } from './eval-types';
import { friendlyMetricName } from './eval-utils';

interface MetricCardProps {
  metricKey: string;
  stats: MetricStats;
  prevStats?: MetricStats;
}

export function MetricCard({ metricKey, stats, prevStats }: MetricCardProps) {
  const rate =
    (stats.pass_rate ?? 0) * (stats.pass_rate && stats.pass_rate <= 1 ? 100 : 1);
  const isPass = rate === 100;
  const isFail = rate < 50;
  const barColor = isPass ? 'bg-green-500' : isFail ? 'bg-red-500' : 'bg-yellow-400';
  const total = (stats.pass ?? 0) + (stats.fail ?? 0);

  const prevRate = prevStats
    ? (prevStats.pass_rate ?? 0) *
      (prevStats.pass_rate && prevStats.pass_rate <= 1 ? 100 : 1)
    : null;
  const delta = prevRate != null ? Math.round(rate - prevRate) : null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">
          {friendlyMetricName(metricKey)}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold tabular-nums ${
              isPass ? 'text-green-600' : isFail ? 'text-red-500' : 'text-yellow-600'
            }`}
          >
            {Math.round(rate)}%
          </span>
          {delta != null && delta !== 0 && (
            <span
              className={`text-xs font-medium ${
                delta > 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
            </span>
          )}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary/50 mb-1.5">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {stats.pass ?? 0} of {total} passed
        </span>
        {stats.score_statistics?.mean != null && (
          <span>avg score {stats.score_statistics.mean.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}
