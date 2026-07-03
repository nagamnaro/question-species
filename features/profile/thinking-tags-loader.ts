import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import type { Json } from "@/types";
import {
  fallbackThinkingTags,
  generateAiThinkingTags,
  mapAiTagsToThinkingTags,
} from "./ai-thinking-tags";
import type { ThinkingTag } from "./thinking-tags";
import { getUserThinkingStats } from "./queries";

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function getSampleAnswers(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("answer_text, reasoning_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];

  return (data ?? []).map((row) => ({
    answer: row.answer_text,
    reasoning: row.reasoning_text,
  }));
}

function isCacheFresh(updatedAt: string | null): boolean {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < CACHE_MAX_AGE_MS;
}

export async function getThinkingTagsForUser(
  userId: string,
): Promise<ThinkingTag[]> {
  const supabase = await createClient();
  const stats = await getUserThinkingStats(userId);

  if (stats.responseCount === 0) {
    return fallbackThinkingTags(stats);
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("thinking_tags_json, thinking_tags_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (
    !userError &&
    userRow?.thinking_tags_json &&
    isCacheFresh(userRow.thinking_tags_updated_at)
  ) {
    try {
      const cached = userRow.thinking_tags_json as {
        tags: { label: string; description: string }[];
      };
      if (cached.tags?.length) {
        return mapAiTagsToThinkingTags(cached);
      }
    } catch {
      // fall through to regenerate
    }
  }

  const samples = await getSampleAnswers(userId);
  const aiTags = await generateAiThinkingTags(stats, samples);

  if (aiTags && aiTags.length > 0) {
    const payload = {
      tags: aiTags.map((tag) => ({
        label: tag.label,
        description: tag.description,
      })),
    };

    const { error: updateError } = await supabase
      .from("users")
      .update({
        thinking_tags_json: payload as unknown as Json,
        thinking_tags_updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError && !isMissingSchemaError(updateError.message)) {
      console.error("Failed to cache thinking tags:", updateError.message);
    }

    return aiTags;
  }

  return fallbackThinkingTags(stats);
}
