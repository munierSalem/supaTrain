'use client';
import { useState } from "react";

export default function UpdateActivitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{updated?: number, error?: string} | null>(null);

  async function handleUpdate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/strava-sync");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Update Activities</h1>
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "Updating…" : "Sync from Strava"}
      </button>

      {result && result.updated && (
        <p className="mt-4 text-green-700">
          ✅ Upserted {result.updated} activities.
        </p>
      )}
      {result && result.error && (
        <p className="mt-4 text-red-700">
          ⚠️ {result.error}
        </p>
      )}
    </div>
  );
}
