'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdateActivitiesPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function runSync() {
      setStatus("loading");
      try {
        const res = await fetch("/api/strava/metadata");
        const data = await res.json();

        if (res.ok) {
          setMessage(`✅ Upserted ${data.updated ?? 0} activities.`);
          setStatus("done");

          // wait a moment to show success message
          setTimeout(() => router.push("/"), 1500);
        } else {
          setMessage(data.error || "Sync failed");
          setStatus("error");
          // optionally redirect home after showing error
          setTimeout(() => router.push("/"), 2500);
        }
      } catch (err: any) {
        setMessage(err.message);
        setStatus("error");
        setTimeout(() => router.push("/"), 2500);
      }
    }

    runSync();
  }, [router]);

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {status === "loading" && <p>⏳ Syncing Strava activities…</p>}
      {status === "done" && <p className="text-green-700">{message}</p>}
      {status === "error" && <p className="text-red-700">{message}</p>}
    </div>
  );
}
