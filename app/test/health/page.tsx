"use client";

import { useEffect } from "react";
import { useHealthMetrics } from "@/app/hooks/useHealthMetrics";

export default function HealthMetricsTestPage() {
  const { metrics, loading } = useHealthMetrics('2025-01-14');  // CHANGE ME to EXPERIMENT

  useEffect(() => {
    if (!loading) {
      console.log("Health metrics:", metrics);
      console.log("max_heartrate:", metrics.max_heartrate);
    }
  }, [loading, metrics]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Health Metrics Test Page</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p><strong>max_heartrate:</strong> {metrics.max_heartrate ?? "Not set"}</p>
        </div>
      )}
    </div>
  );
}
