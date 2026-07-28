"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseBackgroundRefreshOptions = {
  refreshIntervalMs?: number;
  refreshOnFocus?: boolean;
  enabled?: boolean;
};

export function useBackgroundRefresh<T>(
  initialData: T,
  url: string,
  options: UseBackgroundRefreshOptions = {}
) {
  const {
    refreshIntervalMs = 300_000,
    refreshOnFocus = true,
    enabled = true,
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastUpdatedRef = useRef<number | null>(null);

  const fetchFresh = useCallback(async () => {
    if (!enabled) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error(`Failed to refresh data: ${res.status} ${res.statusText}`);
      }
      const fresh = (await res.json()) as T;
      lastUpdatedRef.current = Date.now();
      setData(fresh);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsRefreshing(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await fetchFresh();
    };
    run();
    return () => {
      mounted = false;
    };
  }, [fetchFresh]);

  useEffect(() => {
    if (refreshIntervalMs <= 0 || !enabled) return undefined;
    const id = setInterval(fetchFresh, refreshIntervalMs);
    return () => clearInterval(id);
  }, [fetchFresh, refreshIntervalMs, enabled]);

  useEffect(() => {
    if (!refreshOnFocus || !enabled) return undefined;
    const onFocus = () => fetchFresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchFresh, refreshOnFocus, enabled]);

  return {
    data,
    isRefreshing,
    error,
    lastUpdatedAt: lastUpdatedRef.current,
  };
}
