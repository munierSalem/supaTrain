"use client";

import { useSearchParams } from "next/navigation";
import { useActivityMetadata } from "@/app/hooks/useActivityMetadata";

export default function ActivityTestPage() {
  const search = useSearchParams();
  const rawId = search.get("id");
  const activityId = rawId ? Number(rawId) : null;

  const { activity, loading } = useActivityMetadata(activityId);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Activity Metadata Test</h1>

      {loading && <p>Loading…</p>}

      {!loading && (
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(activity, null, 2)}
        </pre>
      )}
    </div>
  );
}
