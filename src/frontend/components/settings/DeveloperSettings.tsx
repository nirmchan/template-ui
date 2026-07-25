import { useState, useEffect } from 'react';
import { buildAppPath } from '../../lib/app-paths';

type EvalStatus = 'idle' | 'loading' | 'success' | 'error';

interface ActionState {
  status: EvalStatus;
  message: string;
}

const INITIAL: ActionState = { status: 'idle', message: '' };

// --- Eval result types ---

interface ScoreStatistics {
  mean?: number;
  min?: number;
  max?: number;
  std?: number;
}

interface MetricStats {
  pass?: number;
  fail?: number;
  pass_rate?: number;
  score_statistics?: ScoreStatistics;
}

interface OverallStats {
  PASS?: number;
  FAIL?: number;
  ERROR?: number;
  pass_rate?: number;
}

interface SummaryStats {
  overall?: OverallStats;
  by_metric?: Record<string, MetricStats>;
  by_conversation?: Record<string, unknown>;
}

interface EvalSummary {
  total_evaluations?: number;
  summary_stats?: SummaryStats;
}

interface Turn {
  conversation_group_id?: string;
  turn_id?: string;
  metric_identifier?: string;
  result?: string;
  score?: string;
  threshold?: string;
  reason?: string;
  query?: string;
  response?: string;
  tool_calls?: string;
  expected_tool_calls?: string;
}

interface ResultsDetail {
  run_id?: string;
  eval_status?: string;
  eval_score?: number;
  pass?: number;
  fail?: number;
  error?: number;
  summary?: EvalSummary;
  turns?: Turn[];
}

interface EvalRow {
  eval_status?: string;
  eval_score?: number;
  pass?: number;
  fail?: number;
  error?: number;
  results_detail?: ResultsDetail;
  created_at?: string;
  completed_at?: string;
}

// --- Helpers ---

function friendlyMetricName(key: string): string {
  return key
    .replace(/^(custom|geval|deepeval|nlp):/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function friendlyConversationName(key: string): string {
  return key.replace(/_[a-f0-9]{12}$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Sub-components ---

function ScoreHero({
  data,
  prevScore,
}: {
  data: EvalRow;
  prevScore: number | null;
}) {
  const score = data.eval_score ?? null;
  const pct = score != null ? Math.round(score * 100) : null;
  const isGood = (data.eval_status ?? '').toLowerCase() === 'passed' || pct === 100;
  const isBad = (data.eval_status ?? '').toLowerCase() === 'failed' || (pct != null && pct < 50);

  const trend =
    prevScore != null && score != null
      ? Math.round((score - prevScore) * 100)
      : null;

  return (
    <div className={`rounded-xl border-2 px-5 py-4 ${isGood ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : isBad ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tabular-nums ${isGood ? 'text-green-700 dark:text-green-300' : isBad ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {pct != null ? `${pct}%` : '—'}
            </span>
            {trend !== null && (
              <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {trend > 0 ? `↑ +${trend}% vs last run` : trend < 0 ? `↓ ${trend}% vs last run` : '— same as last run'}
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

interface ConvStats { pass?: number; fail?: number }

function MetricSection({ byMetric }: { byMetric: Record<string, MetricStats> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metrics</p>
      <div className="space-y-2">
        {Object.entries(byMetric).map(([key, stats]) => {
          const rate = (stats.pass_rate ?? 0) * (stats.pass_rate && stats.pass_rate <= 1 ? 100 : 1);
          const isPass = rate === 100;
          const isFail = rate < 50;
          const barColor = isPass ? 'bg-green-500' : isFail ? 'bg-red-500' : 'bg-yellow-400';
          const total = (stats.pass ?? 0) + (stats.fail ?? 0);

          return (
            <div key={key} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{friendlyMetricName(key)}</span>
                <span className={`text-sm font-bold tabular-nums ${isPass ? 'text-green-600' : isFail ? 'text-red-500' : 'text-yellow-600'}`}>
                  {Math.round(rate)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary/50 mb-1.5">
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.min(rate, 100)}%` }} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{stats.pass ?? 0} of {total} passed</span>
                {stats.score_statistics?.mean != null && (
                  <span>avg score {stats.score_statistics.mean.toFixed(2)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConversationSection({ byConversation }: { byConversation: Record<string, ConvStats> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversations</p>
      <div className="rounded-lg border border-border overflow-hidden">
        {Object.entries(byConversation).map(([key, stats], i) => {
          const pass = stats.pass ?? 0;
          const fail = stats.fail ?? 0;
          const total = pass + fail;
          const rate = total > 0 ? Math.round((pass / total) * 100) : 0;
          const allPass = fail === 0;

          return (
            <div
              key={key}
              className={`flex items-center justify-between px-3 py-2.5 text-sm ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <span className="font-medium text-foreground truncate max-w-[60%]" title={key}>
                {friendlyConversationName(key)}
              </span>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${allPass ? 'text-green-600' : 'text-red-500'}`}>
                  {rate}%
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {pass}/{total} checks passed
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? '#22c55e' : pct >= 70 ? '#eab308' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="70" y="67" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{pct}%</text>
        <text x="70" y="87" textAnchor="middle" fontSize="11" fill="#6b7280">overall</text>
      </svg>
    </div>
  );
}

function ConversationDetailTable({ turns }: { turns: Turn[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Group turns by conversation_group_id
  const grouped: Record<string, Turn[]> = {};
  for (const t of turns) {
    const conv = t.conversation_group_id ?? 'unknown';
    if (!grouped[conv]) grouped[conv] = [];
    grouped[conv].push(t);
  }

  if (Object.keys(grouped).length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detailed Breakdown</p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([conv, convTurns]) => {
          const isOpen = expanded[conv] ?? true;
          return (
            <div key={conv} className="rounded-lg border border-border overflow-hidden">
              {/* Conversation header */}
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [conv]: !isOpen }))}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/30 hover:bg-secondary/50 text-left"
              >
                <span className="text-sm font-semibold text-foreground">{friendlyConversationName(conv)}</span>
                <span className="text-xs text-muted-foreground">{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Metrics table */}
              {isOpen && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-t border-border bg-secondary/10 text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Metric</th>
                      <th className="px-3 py-2 font-medium">Result</th>
                      <th className="px-3 py-2 font-medium tabular-nums">Score</th>
                      <th className="px-3 py-2 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convTurns.map((turn, i) => {
                      const isPass = (turn.result ?? '').toUpperCase() === 'PASS';
                      const isFail = (turn.result ?? '').toUpperCase() === 'FAIL';
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {friendlyMetricName(turn.metric_identifier ?? '')}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${isPass ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : isFail ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-secondary text-secondary-foreground'}`}>
                              {turn.result ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 tabular-nums text-foreground">
                            {turn.score != null ? Number(turn.score).toFixed(2) : '—'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground max-w-xs">
                            {turn.reason ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvalResultViz({ data, prevScore, full = false }: { data: Record<string, unknown>; prevScore: number | null; full?: boolean }) {
  const row = data as EvalRow;
  const detail = row.results_detail;
  const byMetric = detail?.summary?.summary_stats?.by_metric;
  const byConversation = detail?.summary?.summary_stats?.by_conversation as Record<string, ConvStats> | undefined;
  const turns = detail?.turns ?? [];

  if (!full) {
    return (
      <div className="pt-1">
        <ScoreHero data={row} prevScore={prevScore} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {row.eval_score != null && <ScoreGauge score={row.eval_score} />}
        <div className="flex-1 w-full">
          <ScoreHero data={row} prevScore={prevScore} />
        </div>
      </div>
      {byMetric && Object.keys(byMetric).length > 0 && <MetricSection byMetric={byMetric} />}
      {byConversation && Object.keys(byConversation).length > 0 && <ConversationSection byConversation={byConversation} />}
      {turns.length > 0 && <ConversationDetailTable turns={turns} />}
    </div>
  );
}

function EvalStatusBar({
  status,
  score,
  pass,
  fail,
  createdAt,
}: {
  status: string | null;
  score: number | null;
  pass: number;
  fail: number;
  createdAt: string | null;
}) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!createdAt || (status !== 'in_progress' && status !== 'not_started')) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (secs < 60) setElapsed(`${secs}s`);
      else setElapsed(`${Math.floor(secs / 60)}m ${secs % 60}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, status]);

  if (!status || status === 'unknown') return null;

  if (status === 'in_progress' || status === 'not_started') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Evaluating…</span>
        {elapsed && <span className="text-xs text-blue-500 ml-auto">{elapsed}</span>}
      </div>
    );
  }
  if (status === 'completed' || status === 'passed') {
    const pct = score != null ? Math.round(score * 100) : null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 px-3 py-2">
        <span className="text-green-600">✓</span>
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          {pct != null ? `${pct}%` : 'Completed'}
        </span>
        <span className="text-xs text-green-600">{pass} passed · {fail} failed</span>
      </div>
    );
  }
  if (status === 'failed' || status === 'error') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-3 py-2">
        <span className="text-red-500">✗</span>
        <span className="text-sm font-medium text-red-700 dark:text-red-300">Eval failed</span>
        {pass > 0 || fail > 0 ? <span className="text-xs text-red-500">{pass} passed · {fail} failed</span> : null}
      </div>
    );
  }
  return null;
}

// --- Main component ---

export function DeveloperSettings() {
  const [evaluateState, setEvaluateState] = useState<ActionState>(INITIAL);
  const [resultState, setResultState] = useState<ActionState>(INITIAL);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [forceMode, setForceMode] = useState(false);
  const [evalStatus, setEvalStatus] = useState<{
    status: string | null;
    score: number | null;
    pass: number;
    fail: number;
    createdAt: string | null;
  }>({ status: null, score: null, pass: 0, fail: 0, createdAt: null });
  const [isEvalRunning, setIsEvalRunning] = useState(false);

  // Fetch initial status on mount
  useEffect(() => {
    fetch(buildAppPath('/api/proxy/agent/evals/status'), { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then((data: Record<string, unknown> | null) => {
        if (!data) return;
        const st = data.eval_status as string | undefined;
        if (!st || st === 'not_started') return;
        setEvalStatus({
          status: st,
          score: typeof data.eval_score === 'number' ? data.eval_score : null,
          pass: typeof data.pass === 'number' ? data.pass : 0,
          fail: typeof data.fail === 'number' ? data.fail : 0,
          createdAt: typeof data.created_at === 'string' ? data.created_at : null,
        });
        if (st === 'in_progress' || st === 'not_started') setIsEvalRunning(true);
        if (st === 'completed' || st === 'passed') {
          fetch(buildAppPath('/api/proxy/agent/evals/results'), { credentials: 'same-origin' })
            .then(r => r.ok ? r.json() : null)
            .then((rData: Record<string, unknown> | null) => { if (rData) setResult(rData); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Poll status every 5 seconds when running
  useEffect(() => {
    if (!isEvalRunning) return;
    const poll = async () => {
      try {
        const res = await fetch(buildAppPath('/api/proxy/agent/evals/status'), {
          credentials: 'same-origin',
        });
        if (!res.ok) return;
        const data = (await res.json()) as Record<string, unknown>;
        const st = data.eval_status as string | undefined;
        setEvalStatus({
          status: st ?? null,
          score: typeof data.eval_score === 'number' ? data.eval_score : null,
          pass: typeof data.pass === 'number' ? data.pass : 0,
          fail: typeof data.fail === 'number' ? data.fail : 0,
          createdAt: typeof data.created_at === 'string' ? data.created_at : null,
        });
        if (st === 'completed' || st === 'passed') {
          setIsEvalRunning(false);
          const rRes = await fetch(buildAppPath('/api/proxy/agent/evals/results'), { credentials: 'same-origin' });
          if (rRes.ok) {
            const rData = (await rRes.json()) as Record<string, unknown>;
            setPrevScore((result as { eval_score?: number } | null)?.eval_score ?? null);
            setResult(rData);
          }
        } else if (st === 'failed' || st === 'error') {
          setIsEvalRunning(false);
        }
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [isEvalRunning]);

  const callEval = async (
    path: string,
    method: string,
    setState: (s: ActionState) => void,
    onData?: (d: Record<string, unknown>) => void,
    body?: Record<string, unknown>,
  ) => {
    setState({ status: 'loading', message: '' });
    try {
      const res = await fetch(buildAppPath(path), {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setState({ status: 'error', message: (data.detail as string) || res.statusText });
        return;
      }
      setState({ status: 'success', message: JSON.stringify(data, null, 2) });
      onData?.(data);
    } catch (e) {
      setState({ status: 'error', message: String(e) });
    }
  };

  const fetchResult = async () => {
    setResultState({ status: 'loading', message: '' });
    try {
      const res = await fetch(buildAppPath('/api/proxy/agent/evals/results'), {
        credentials: 'same-origin',
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) { setResultState({ status: 'error', message: (data.detail as string) || res.statusText }); return; }
      setResultState({ status: 'success', message: '' });
      setPrevScore((result as { eval_score?: number } | null)?.eval_score ?? null);
      setResult(data);
    } catch (e) {
      setResultState({ status: 'error', message: String(e) });
    }
  };

  const handleTrigger = async (force: boolean) => {
    const setState = setEvaluateState;
    const triggerPath = force
      ? '/api/proxy/agent/evals/force-trigger'
      : '/api/proxy/agent/evals/trigger';

    setState({ status: 'loading', message: '' });
    try {
      const triggerRes = await fetch(buildAppPath(triggerPath), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const triggerData = (await triggerRes.json()) as Record<string, unknown>;
      if (!triggerRes.ok) {
        setState({ status: 'error', message: (triggerData.detail as string) || triggerRes.statusText });
        return;
      }

      const isCached = (triggerData as { cached?: boolean }).cached;
      const isAlreadyRunning = triggerData.eval_status === 'in_progress' && !!(triggerData as { message?: string }).message;

      if (isCached) {
        setState({ status: 'success', message: 'Already complete — showing latest result.' });
        setEvalStatus({
          status: 'completed',
          score: typeof triggerData.eval_score === 'number' ? triggerData.eval_score : null,
          pass: typeof triggerData.pass === 'number' ? triggerData.pass : 0,
          fail: typeof triggerData.fail === 'number' ? triggerData.fail : 0,
          createdAt: typeof triggerData.created_at === 'string' ? triggerData.created_at : null,
        });
        await fetchResult();
        return;
      }
      if (isAlreadyRunning) {
        setState({ status: 'success', message: 'Eval already running — check back shortly.' });
        setIsEvalRunning(true);
        return;
      }

      setState({ status: 'success', message: 'Eval queued — running in background.' });
      setIsEvalRunning(true);
      setEvalStatus({ status: 'in_progress', score: null, pass: 0, fail: 0, createdAt: new Date().toISOString() });
    } catch (e) {
      setState({ status: 'error', message: String(e) });
    }
  };

  const statusColor = (s: EvalStatus) => {
    if (s === 'success') return 'text-green-600 dark:text-green-400';
    if (s === 'error') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <div className="pt-2 space-y-3">
        {/* Status bar */}
        <EvalStatusBar {...evalStatus} />

        {/* Buttons row */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Evaluate */}
          <div className="relative group">
            <button
              onClick={() => void handleTrigger(forceMode)}
              disabled={evaluateState.status === 'loading' || isEvalRunning}
              className="w-36 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {evaluateState.status === 'loading' ? 'Running…' : 'Evaluate'}
            </button>
            <div className="absolute left-0 top-full mt-1.5 z-10 hidden group-hover:block w-56 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md pointer-events-none">
              Returns cached result if already complete, otherwise queues a new eval run.
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={forceMode}
              onChange={(e) => setForceMode(e.target.checked)}
              disabled={isEvalRunning}
              className="rounded border-border"
            />
            Force re-run (skip cache)
          </label>

        </div>

        {/* Status message below the row */}
        {evaluateState.message && (
          <p className={`text-xs ${statusColor(evaluateState.status)}`}>{evaluateState.message}</p>
        )}
      </div>

      {/* Eval result visualization */}
      {result && (
        <div className="mt-2">
          <EvalResultViz data={result} prevScore={prevScore} />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setDetailOpen(true)}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              View full report
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
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
        </div>
      )}

      {/* Full report modal */}
      {detailOpen && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-base font-semibold text-foreground">Agent Evaluation Report</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto p-5">
              <EvalResultViz data={result} prevScore={prevScore} full />
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
      )}
    </div>
  );
}
