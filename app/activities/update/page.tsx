'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateActivitiesPage() {
  const router = useRouter();
  const [activityResult, setActivityResult] = useState<{ updated?: number; error?: string } | null>(null);
  const [missingGpx, setMissingGpx] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runFullSync() {
      setLoading(true);

      // 1️⃣ Step 1: Sync metadata
      try {
        const res = await fetch("/api/strava/metadata");
        const data = await res.json();
        setActivityResult(data);
      } catch (err: any) {
        setActivityResult({ error: err.message });
        setLoading(false);
        return;
      }

      // 2️⃣ Step 2: Fetch missing GPX list
      try {
        const res = await fetch("/api/strava/missing-gpx");
        const data = await res.json();
        if (res.ok) setMissingGpx(data.missing || []);
        else throw new Error(data.error || "Failed to check GPX");
      } catch (err: any) {
        console.error(err);
        setMissingGpx([]);
      } finally {
        setLoading(false);
      }
    }

    runFullSync();
  }, [router]);

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {loading && <p>⏳ Syncing Strava activities…</p>}

      {activityResult?.updated && (
        <div className="mb-4 text-green-700">
          ✅ Upserted {activityResult.updated} activities.
        </div>
      )}
      {activityResult?.error && (
        <div className="mb-4 text-red-700">
          ⚠️ {activityResult.error}
        </div>
      )}

      {missingGpx && (
        <div className="mt-6">
          <p className="font-medium">
            {missingGpx.length
              ? `📂 ${missingGpx.length} activities missing GPX files`
              : "🎉 All activities have GPX files"}
          </p>
          {missingGpx.length > 0 && (
            <ul className="text-sm text-gray-600 mt-2 max-h-40 overflow-auto">
              {missingGpx.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
