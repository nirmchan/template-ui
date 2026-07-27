import type { EvalRow } from './eval-types';

interface ScoreHeroProps {
  data: EvalRow;
  prevScore: number | null;
}

export function ScoreHero({ data, prevScore }: ScoreHeroProps) {
  const score = data.eval_score ?? null;
  const pct = score != null ? Math.round(score * 100) : null;
  const isGood = (data.eval_status ?? '').toLowerCase() === 'passed' || pct === 100;
  const isBad =
    (data.eval_status ?? '').toLowerCase() === 'failed' || (pct != null && pct < 50);

  const trend =
    prevScore != null && score != null ? Math.round((score - prevScore) * 100) : null;

  return (
    <div
      className={`rounded-xl border-2 px-5 py-4 ${
        isGood
          ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
          : isBad
            ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
            : 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-extrabold tabular-nums ${
                isGood
                  ? 'text-green-700 dark:text-green-300'
                  : isBad
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
              }`}
            >
              {pct != null ? `${pct}%` : '—'}
            </span>
            {trend !== null && (
              <span
                className={`text-sm font-semibold ${
                  trend > 0
                    ? 'text-green-600'
                    : trend < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                }`}
              >
                {trend > 0
                  ? `↑ +${trend}% vs last run`
                  : trend < 0
                    ? `↓ ${trend}% vs last run`
                    : '— same as last run'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground capitalize">
            {data.eval_status ?? 'unknown'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            {data.pass ?? 0} passed
          </span>
          <span className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            {data.fail ?? 0} failed
          </span>
          {(data.error ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-orange-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
              {data.error} errors
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
