import { useEffect, useState } from 'react';

interface EvalStatusBarProps {
  status: string | null;
  score: number | null;
  pass: number;
  fail: number;
  createdAt: string | null;
}

export function EvalStatusBar({ status, score, pass, fail, createdAt }: EvalStatusBarProps) {
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
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Evaluating...</span>
        {elapsed && <span className="text-xs text-blue-500 ml-auto">{elapsed}</span>}
      </div>
    );
  }

  if (status === 'completed' || status === 'passed') {
    const pct = score != null ? Math.round(score * 100) : null;
    const isGood = pct == null || pct >= 70;
    const borderCls = isGood ? 'border-green-200' : 'border-red-200';
    const bgCls = isGood ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20';
    const iconCls = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    const textCls = isGood ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300';
    const subCls = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    return (
      <div className={`flex items-center gap-2 rounded-lg border ${borderCls} ${bgCls} px-3 py-2`}>
        <span className={iconCls}>{isGood ? '✓' : '✗'}</span>
        <span className={`text-sm font-medium ${textCls}`}>
          {pct != null ? `${pct}%` : 'Completed'}
        </span>
        <span className={`text-xs ${subCls}`}>
          {pass} passed &middot; {fail} failed
        </span>
      </div>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-3 py-2">
        <span className="text-red-500">&#10007;</span>
        <span className="text-sm font-medium text-red-700 dark:text-red-300">Eval failed</span>
        {(pass > 0 || fail > 0) && (
          <span className="text-xs text-red-500">
            {pass} passed &middot; {fail} failed
          </span>
        )}
      </div>
    );
  }

  return null;
}
