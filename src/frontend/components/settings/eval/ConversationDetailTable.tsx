import { useState } from 'react';
import type { Turn } from './eval-types';
import { friendlyMetricName, friendlyConversationName } from './eval-utils';

interface ConversationDetailTableProps {
  turns: Turn[];
}

export function ConversationDetailTable({ turns }: ConversationDetailTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grouped: Record<string, Turn[]> = {};
  for (const t of turns) {
    const conv = t.conversation_group_id ?? 'unknown';
    if (!grouped[conv]) grouped[conv] = [];
    grouped[conv].push(t);
  }

  if (Object.keys(grouped).length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Detailed Breakdown
      </p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([conv, convTurns]) => {
          const isOpen = expanded[conv] ?? true;
          return (
            <div key={conv} className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [conv]: !isOpen }))
                }
                className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/30 hover:bg-secondary/50 text-left"
              >
                <span className="text-sm font-semibold text-foreground">
                  {friendlyConversationName(conv)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

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
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 font-semibold ${
                                isPass
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                  : isFail
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                    : 'bg-secondary text-secondary-foreground'
                              }`}
                            >
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
