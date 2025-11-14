// app/profile/ProfileForm.tsx

"use client";

import { useState, useEffect } from "react";

export default function ProfileForm() {
  const [maxHeartRate, setmaxHeartRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load existing max HR
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const res = await fetch("/api/health-metrics/upsert-max-heartrate");
      if (res.ok) {
        const data = await res.json();
        if (data.max_heartrate !== undefined) {
          setmaxHeartRate(data.max_heartrate);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/health-metrics/upsert-max-heartrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_heartrate: maxHeartRate }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) setMessage("Saved!");
    else setMessage(data.error || "Error saving.");
  }

  if (loading) return <p>Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Max Heart Rate</label>
        <input
          type="number"
          min={1}
          max={300}
          value={maxHeartRate ?? ""}
          onChange={(e) => setmaxHeartRate(parseInt(e.target.value))}
          className="border p-2 rounded w-full"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
