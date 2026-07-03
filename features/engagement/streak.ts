import { createClient } from "@/lib/supabase/server";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Consecutive days with at least one answer (MVP plan: light-touch streaks). */
export async function getUserStreak(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return 0;

  const answerDates = new Set(data.map((r) => toDateKey(r.created_at)));
  const today = todayDateKey();
  const yesterday = previousDateKey(today);

  let cursor: string | null = null;
  if (answerDates.has(today)) {
    cursor = today;
  } else if (answerDates.has(yesterday)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (cursor && answerDates.has(cursor)) {
    streak++;
    cursor = previousDateKey(cursor);
  }

  return streak;
}
