import type { ActionState, EvalStatus } from './eval-types';

interface EvalControlsProps {
  onTrigger: (force: boolean) => void;
  isRunning: boolean;
  triggerState: ActionState;
  forceMode: boolean;
  onForceModeChange: (force: boolean) => void;
}

function statusColor(s: EvalStatus) {
  if (s === 'success') return 'text-green-600 dark:text-green-400';
  if (s === 'error') return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export function EvalControls({
  onTrigger,
  isRunning,
  triggerState,
  forceMode,
  onForceModeChange,
}: EvalControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative group">
          <button
            onClick={() => onTrigger(forceMode)}
            disabled={triggerState.status === 'loading' || isRunning}
            className="w-36 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {triggerState.status === 'loading' ? 'Running…' : 'Evaluate'}
          </button>
          <div className="absolute left-0 top-full mt-1.5 z-10 hidden group-hover:block w-56 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md pointer-events-none">
            Returns cached result if already complete, otherwise queues a new eval run.
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={forceMode}
            onChange={(e) => onForceModeChange(e.target.checked)}
            disabled={isRunning}
            className="rounded border-border"
          />
          Force re-run (skip cache)
        </label>
      </div>

      {triggerState.message && (
        <p className={`text-xs ${statusColor(triggerState.status)}`}>
          {triggerState.message}
        </p>
      )}
    </div>
  );
}
