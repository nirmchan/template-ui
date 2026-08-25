import { Button } from '@patternfly/react-core';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useDeploymentInfo } from '../../hooks/useDeploymentInfo';
import { cn } from '@/lib/utils';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PodCard({
  label,
  pod,
}: {
  label: string;
  pod: { status: string; image: string; imageTag: string; startedAt: string | null; podName: string };
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className={cn('font-medium', pod.status === 'Running' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')}>
          {pod.status}
        </span>

        <span className="text-muted-foreground">Image</span>
        <span className="text-foreground font-mono text-xs truncate" title={pod.image}>
          {pod.imageTag}
        </span>

        <span className="text-muted-foreground">Full image</span>
        <span className="text-foreground/70 font-mono text-xs truncate" title={pod.image}>
          {pod.image}
        </span>

        <span className="text-muted-foreground">Started</span>
        <span className="text-foreground">{formatTimestamp(pod.startedAt)}</span>

        <span className="text-muted-foreground">Pod</span>
        <span className="text-foreground/70 font-mono text-xs truncate" title={pod.podName}>
          {pod.podName}
        </span>
      </div>
    </div>
  );
}

export function AboutSection() {
  const { data, loading, error, refresh } = useDeploymentInfo();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Deployment details for the agent and UI pods running in this namespace.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={refresh}
          isDisabled={loading}
          icon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading deployment info...</span>
        </div>
      ) : error && !data ? (
        <div className="text-sm text-destructive py-4">{error}</div>
      ) : data?.availableInCluster === false ? (
        <div className="text-sm text-muted-foreground/60 italic py-4">
          Deployment info is only available when running inside a Kubernetes cluster.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.namespace && (
            <div className="text-sm">
              <span className="text-muted-foreground">Namespace: </span>
              <span className="font-mono text-xs text-foreground">{data.namespace}</span>
            </div>
          )}

          {data?.agent ? (
            <PodCard label="Agent" pod={data.agent} />
          ) : (
            <div className="text-sm text-muted-foreground italic">Agent pod not found</div>
          )}

          {data?.ui ? (
            <PodCard label="UI" pod={data.ui} />
          ) : (
            <div className="text-sm text-muted-foreground italic">UI pod not found</div>
          )}
        </div>
      )}
    </div>
  );
}
