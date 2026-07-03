"use client";

import { useEffect, useState } from "react";
import { getCurrentUserStreak } from "@/features/engagement/actions";

export function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUserStreak().then(setStreak);
  }, []);

  if (streak === null || streak === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300"
      title="Consecutive days you've answered a question"
    >
      <span aria-hidden="true">🔥</span>
      {streak} day{streak !== 1 ? "s" : ""}
    </span>
  );
}
