"use client";

import { useEffect, useState } from "react";

export function useActivityMetadata(activityId: number | null) {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activityId) return;

    async function fetchActivity() {
      setLoading(true);

      const res = await fetch(`/api/activity/get?id=${activityId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch activity", await res.text());
        setActivity(null);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setActivity(json.activity ?? null);
      setLoading(false);
    }

    fetchActivity();
  }, [activityId]);

  return { activity, loading };
}
