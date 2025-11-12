'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateActivitiesPage() {
  const router = useRouter();
  const [activityResult, setActivityResult] = useState<{ updated?: number; error?: string } | null>(null);
  const [missingStream, setmissingStream] = useState<number[]>([]);
  const [missingAnalysis, setmissingAnalysis] = useState<number[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [numErrors, setNumErrors] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"metadata" | "streams" | "analysis" | "done" | "error">("metadata");

  useEffect(() => {
    async function runFullSync() {
      setLoading(true);
      try {
        // 1️⃣ Metadata sync
        const metaRes = await fetch("/api/strava/metadata");
        const metaData = await metaRes.json();
        setActivityResult(metaData);
        if (!metaRes.ok) throw new Error(metaData.error || "Metadata sync failed");

        // 2️⃣ Fetch missing streams
        setPhase("streams");
        const missRes = await fetch("/api/strava/missing-streams");
        const missData = await missRes.json();
        if (!missRes.ok) throw new Error(missData.error || "Missing Stream fetch failed");
        setmissingStream(missData.missing || []);

        // 3️⃣ Loop through stream downloads
        let total = missData.missing?.length ?? 0;
        if (total > 0) {
          let count = 0;
          let errorCount = 0;
          for (const id of missData.missing) {
            try {
              const res = await fetch(`/api/strava/stream?id=${id}`);
              count++;
              setProgress(count);
              if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
            } catch (err) {
              errorCount++;
              setNumErrors(errorCount);
              console.error("Stream download failed for", id, err);
            }
          }
        }

        // 4️⃣ Fetch activities w/o analysis
        setPhase("analysis");
        const missAnalysisRes = await fetch("/api/analysis/missing");
        const missAnalysis = await missAnalysisRes.json();
        if (!missAnalysisRes.ok) throw new Error(missAnalysisRes.error || "Missing Analysis fetch failed");
        setmissingAnalysis(missAnalysis.missing || []);

        // 5️⃣ Loop through stream downloads
        let total = missAnalysis.missing?.length ?? 0;
        if (total > 0) {
          let count = 0;
          let errorCount = 0;

          setTimeout(() => router.push("/"), 1500);  // small delay FIXME
          // for (const id of missAnalysis.missing) {
          //   try {
          //     const res = await fetch(`/api/strava/stream?id=${id}`);
          //     count++;
          //     setProgress(count);
          //     if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
          //   } catch (err) {
          //     errorCount++;
          //     setNumErrors(errorCount);
          //     console.error("Stream download failed for", id, err);
          //   }
          // }
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

  const total = missingStream.length || 0;

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

      {phase === "streams" && (
        <>
          <div className="text-green-700">
            ✅ Upserted {activityResult?.updated ?? 0} activities.
          </div>
          <div className="mt-4">
            <p>📂 Downloading Stream files…</p>
            <p>{progress} / {total} completed { numErrors > 0 ? `[${numErrors} errors]` : ''}</p>
            <div className="w-full bg-gray-200 h-2 mt-2 rounded">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </>
      )}

      {phase === "analysis" && (
        <>
          <div className="text-green-700">
            ✅ Upserted {activityResult?.updated ?? 0} activities.
          </div>
          <div className="text-green-700 mt-4">
            🎉 Stream files downloaded and saved!
          </div>
          <div className="mt-4">
            <p>📈 Running Activity Analyses…</p>
            <p>{progress} / {total} completed { numErrors > 0 ? `[${numErrors} errors]` : ''}</p>
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
          🎉 Stream files downloaded and saved!
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
