import { useState, useMemo } from 'react';
import { useEvalDashboard } from '../../../hooks/useEvalDashboard';
import type { Turn, ConvStats } from './eval-types';
import { EvalControls } from './EvalControls';
import { EvalStatusBar } from './EvalStatusBar';
import { ScoreHero } from './ScoreHero';
import { CategoryCard } from './CategoryCard';
import { TrendChart } from './TrendChart';
import { MetricCard } from './MetricCard';
import { ConversationSection } from './ConversationSection';
import { ConversationDetailTable } from './ConversationDetailTable';
import { FullReportModal } from './FullReportModal';

interface TagGroup {
  tag: string;
  passCount: number;
  failCount: number;
  latestScore: number | null;
  prevScore: number | null;
  history: number[];
}

function groupTurnsByTag(
  turns: Turn[],
  historyRuns?: { eval_score: number }[],
): TagGroup[] {
  const tagMap = new Map<string, { pass: number; fail: number; scores: number[] }>();

  for (const turn of turns) {
    const tag = turn.tag ?? 'other';
    if (!tagMap.has(tag)) tagMap.set(tag, { pass: 0, fail: 0, scores: [] });
    const group = tagMap.get(tag)!;
    const result = (turn.result ?? '').toUpperCase();
    if (result === 'PASS') group.pass++;
    else if (result === 'FAIL') group.fail++;
    if (turn.score != null) group.scores.push(parseFloat(turn.score));
  }

  return Array.from(tagMap.entries()).map(([tag, group]) => {
    const total = group.pass + group.fail;
    const latestScore = total > 0 ? group.pass / total : null;
    const history = historyRuns
      ? historyRuns.map((r) => r.eval_score).reverse()
      : [];

    return {
      tag,
      passCount: group.pass,
      failCount: group.fail,
      latestScore,
      prevScore: history.length >= 2 ? history[history.length - 2] : null,
      history,
    };
  });
}

export function EvalDashboard() {
  const {
    evalState,
    isRunning,
    result,
    prevScore,
    history,
    trends,
    triggerState,
    trigger,
    detailOpen,
    setDetailOpen,
  } = useEvalDashboard();

  const [forceMode, setForceMode] = useState(false);

  const detail = result?.results_detail;
  const byMetric = detail?.summary?.summary_stats?.by_metric;
  const byConversation = detail?.summary?.summary_stats?.by_conversation;
  const turns = detail?.turns ?? [];

  const tagGroups = useMemo(
    () => groupTurnsByTag(turns, history?.runs),
    [turns, history?.runs],
  );

  const hasResult = result != null;
  const hasHistory = (history?.runs?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <EvalControls
        onTrigger={trigger}
        isRunning={isRunning}
        triggerState={triggerState}
        forceMode={forceMode}
        onForceModeChange={setForceMode}
      />

      <EvalStatusBar
        status={isRunning ? 'in_progress' : evalState.status}
        score={evalState.score}
        pass={evalState.pass}
        fail={evalState.fail}
        createdAt={
          isRunning && evalState.lastChecked
            ? evalState.lastChecked.toISOString()
            : null
        }
      />

      {hasResult && result && (
        <>
          <ScoreHero data={result} prevScore={prevScore} />

          {tagGroups.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tagGroups.map((group) => (
                  <CategoryCard
                    key={group.tag}
                    tag={group.tag}
                    latestScore={group.latestScore}
                    passCount={group.passCount}
                    failCount={group.failCount}
                    history={group.history}
                    prevScore={group.prevScore}
                  />
                ))}
              </div>
            </div>
          )}

          {trends && <TrendChart data={trends} />}

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

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setDetailOpen(true)}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              View full report
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'eval-report.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Export JSON
            </button>
          </div>
        </>
      )}

      {!hasResult && !isRunning && !hasHistory && (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No evaluation history yet. Run your first eval to see results and trends.
          </p>
        </div>
      )}

      {detailOpen && result && (
        <FullReportModal
          result={result}
          prevScore={prevScore}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
