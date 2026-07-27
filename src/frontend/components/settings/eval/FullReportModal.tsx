import type { EvalRow, ConvStats } from './eval-types';
import { ScoreGauge } from './ScoreGauge';
import { ScoreHero } from './ScoreHero';
import { MetricCard } from './MetricCard';
import { ConversationSection } from './ConversationSection';
import { ConversationDetailTable } from './ConversationDetailTable';

interface FullReportModalProps {
  result: EvalRow;
  prevScore: number | null;
  onClose: () => void;
}

export function FullReportModal({ result, prevScore, onClose }: FullReportModalProps) {
  const detail = result.results_detail;
  const byMetric = detail?.summary?.summary_stats?.by_metric;
  const byConversation = detail?.summary?.summary_stats?.by_conversation;
  const turns = detail?.turns ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">
            Agent Evaluation Report
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            &#10005;
          </button>
        </div>
        <div className="overflow-auto p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {result.eval_score != null && <ScoreGauge score={result.eval_score} />}
            <div className="flex-1 w-full">
              <ScoreHero data={result} prevScore={prevScore} />
            </div>
          </div>
          {byMetric && Object.keys(byMetric).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Metrics
              </p>
              <div className="space-y-2">
                {Object.entries(byMetric).map(([key, stats]) => (
                  <MetricCard key={key} metricKey={key} stats={stats} />
                ))}
              </div>
            </div>
          )}
          {byConversation && Object.keys(byConversation).length > 0 && (
            <ConversationSection byConversation={byConversation} />
          )}
          {turns.length > 0 && <ConversationDetailTable turns={turns} />}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Raw JSON
            </summary>
            <pre className="mt-2 text-xs rounded bg-secondary/30 p-3 overflow-auto max-h-64 text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
