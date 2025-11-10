'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateActivitiesPage() {
  const router = useRouter();
  const [activityResult, setActivityResult] = useState<{ updated?: number; error?: string } | null>(null);
  const [missingGpx, setMissingGpx] = useState<number[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"metadata" | "gpx" | "done" | "error">("metadata");

  useEffect(() => {
    async function runFullSync() {
      setLoading(true);
      try {
        // 1️⃣ Metadata sync
        const metaRes = await fetch("/api/strava/metadata");
        const metaData = await metaRes.json();
        setActivityResult(metaData);
        if (!metaRes.ok) throw new Error(metaData.error || "Metadata sync failed");

        // 2️⃣ Fetch missing GPX
        setPhase("gpx");
        const missRes = await fetch("/api/strava/missing-gpx");
        const missData = await missRes.json();
        if (!missRes.ok) throw new Error(missData.error || "Missing GPX fetch failed");
        setMissingGpx(missData.missing || []);

        // 3️⃣ Loop through GPX downloads
        const total = missData.missing?.length ?? 0;
        if (total > 0) {
          let count = 0;
          for (const id of missData.missing) {
            try {
              await fetch(`/api/strava/gpx?id=${id}`);
              count++;
              setProgress(count);
            } catch (err) {
              console.error("GPX download failed for", id, err);
            }
          }
        }

        setPhase("done");
        // small delay to let user see "done" message
        setTimeout(() => router.push("/"), 1500);
      } catch (err) {
        console.error(err);
        setPhase("error");
        setTimeout(() => router.push("/"), 2500);
      } finally {
        setLoading(false);
      }
    }

    runFullSync();
  }, [router]);

  const total = missingGpx.length || 0;

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {phase === "metadata" && (
        <>
          <p>⏳ Syncing Strava activities…</p>
          {activityResult?.updated && (
            <div className="mt-2 text-green-700">
              ✅ Upserted {activityResult.updated} activities.
            </div>
          )}
        </>
      )}

      {phase === "gpx" && (
        <>
          <div className="text-green-700">
            ✅ Upserted {activityResult?.updated ?? 0} activities.
          </div>
          <div className="mt-4">
            <p>📂 Downloading GPX files…</p>
            <p>{progress} / {total} completed</p>
            <div className="w-full bg-gray-200 h-2 mt-2 rounded">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="text-green-700 mt-4">
          🎉 All GPX files downloaded and saved!
        </div>
      )}

      {phase === "error" && (
        <div className="text-red-700 mt-4">
          ⚠️ Something went wrong during sync.
        </div>
      )}
    </div>
  );
}
