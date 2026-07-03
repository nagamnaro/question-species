import { hostedChatJson } from "@/lib/ai/hosted-llm";
import { isHostedLlmConfigured } from "@/lib/ai/config";
import type { ThinkingTag, UserThinkingStats } from "./thinking-tags";
import { deriveThinkingTags } from "./thinking-tags";

interface AiTagPayload {
  tags: { label: string; description: string }[];
}

const TAG_STYLES = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
];

export function mapAiTagsToThinkingTags(
  payload: AiTagPayload,
): ThinkingTag[] {
  return payload.tags.slice(0, 4).map((tag, index) => ({
    label: tag.label,
    description: tag.description,
    className: TAG_STYLES[index % TAG_STYLES.length]!,
  }));
}

export async function generateAiThinkingTags(
  stats: UserThinkingStats,
  sampleAnswers: { answer: string; reasoning: string | null }[],
): Promise<ThinkingTag[] | null> {
  if (!isHostedLlmConfigured() || sampleAnswers.length === 0) {
    return null;
  }

  const prompt = JSON.stringify(
    {
      response_count: stats.responseCount,
      reasoning_rate: stats.reasoningCount / Math.max(stats.responseCount, 1),
      species_mix: stats.speciesCounts,
      sample_answers: sampleAnswers.slice(0, 8),
    },
    null,
    2,
  );

  const raw = await hostedChatJson([
    {
      role: "system",
      content:
        'Return JSON: { "tags": [{ "label": "2-4 word tag", "description": "one sentence" }] }. Produce 3-4 neutral thinking-style tags (e.g. contrarian, analytical, pragmatic). No judgment.',
    },
    { role: "user", content: prompt },
  ]);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AiTagPayload;
    if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) return null;
    return mapAiTagsToThinkingTags(parsed);
  } catch {
    return null;
  }
}

export function fallbackThinkingTags(stats: UserThinkingStats): ThinkingTag[] {
  return deriveThinkingTags(stats);
}
