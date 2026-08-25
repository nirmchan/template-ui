import { useCallback, useEffect, useRef, useState } from 'react';
import { buildAppPath } from '../lib/app-paths';

export interface PodInfo {
  status: string;
  image: string;
  imageTag: string;
  startedAt: string | null;
  podName: string;
}

export interface DeploymentInfo {
  agent: PodInfo | null;
  ui: PodInfo | null;
  namespace: string | null;
  availableInCluster: boolean;
}

export interface DeploymentInfoState {
  data: DeploymentInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDeploymentInfo(): DeploymentInfoState {
  const [data, setData] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchInfo = useCallback(async () => {
    if (mounted.current) setLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(buildAppPath('/api/deployment/info'), {
        credentials: 'same-origin',
        signal: controller.signal,
      });
      if (!res.ok) {
        if (mounted.current) {
          setError(`HTTP ${res.status}`);
          setLoading(false);
        }
        return;
      }
      const payload = (await res.json()) as DeploymentInfo;
      if (mounted.current) {
        setData(payload);
        setError(null);
        setLoading(false);
      }
    } catch {
      if (mounted.current) {
        setError('Failed to fetch deployment info');
        setLoading(false);
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void fetchInfo();
    const id = window.setInterval(() => {
      void fetchInfo();
    }, 5 * 60 * 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted.current) {
        void fetchInfo();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted.current = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchInfo]);

  return { data, loading, error, refresh: fetchInfo };
}
