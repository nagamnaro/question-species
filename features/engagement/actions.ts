"use server";

import { getAuthUserId } from "@/features/responses/queries";
import { getUserStreak } from "./streak";

export async function getCurrentUserStreak(): Promise<number> {
  const userId = await getAuthUserId();
  if (!userId) return 0;
  return getUserStreak(userId);
}
