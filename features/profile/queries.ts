import { createClient } from "@/lib/supabase/server";
import {
  parseSpeciesCounts,
  type UserThinkingStats,
} from "./thinking-tags";

export async function getUserThinkingStats(
  userId: string,
): Promise<UserThinkingStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_thinking_stats", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Failed to fetch thinking stats:", error.message);
    return { responseCount: 0, reasoningCount: 0, speciesCounts: {} };
  }

  const row = data?.[0];
  if (!row) {
    return { responseCount: 0, reasoningCount: 0, speciesCounts: {} };
  }

  return {
    responseCount: Number(row.response_count),
    reasoningCount: Number(row.reasoning_count),
    speciesCounts: parseSpeciesCounts(row.species_counts as Record<string, number>),
  };
}
