"use client";

import { useEffect, useState } from "react";

export function useHealthMetrics(asOfDate?: string) {
  const [metrics, setMetrics] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = asOfDate ? `?asOf=${encodeURIComponent(asOfDate)}` : "";

    async function load() {
      setLoading(true);

      const res = await fetch(`/api/health-metrics/get${query}`);
      const json = await res.json();

      setMetrics(json.metrics ?? {});
      setLoading(false);
    }

    load();
  }, [asOfDate]);

  return { metrics, loading };
}
