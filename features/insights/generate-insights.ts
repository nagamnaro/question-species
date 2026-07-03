import { hostedChatJson } from "@/lib/ai/hosted-llm";
import { isHostedLlmConfigured } from "@/lib/ai/config";
import type { Question } from "@/types";
import type { ResponseWithUser } from "@/features/responses/queries";
import { generateHeuristicInsights } from "./heuristic-clusters";
import { getQuestionInsight, saveQuestionInsight } from "./queries";
import type { InsightPayload, InsightResult, ReasoningCluster } from "./types";

const MIN_RESPONSES_FOR_INSIGHTS = 2;

function buildPrompt(
  question: Pick<Question, "text" | "species">,
  responses: ResponseWithUser[],
): string {
  const anonymized = responses.map((r, index) => ({
    id: index + 1,
    answer: r.answer_text,
    reasoning: r.reasoning_text ?? null,
  }));

  return JSON.stringify(
    {
      question: question.text,
      species: question.species,
      responses: anonymized,
    },
    null,
    2,
  );
}

const SYSTEM_PROMPT = `You analyze anonymized responses to curiosity-driven questions for a social app called Question Species.

Group responses into 3–6 reasoning clusters based on how people think (not just identical wording). Each cluster should capture a distinct line of reasoning or answer pattern.

Return valid JSON only, with this exact shape:
{
  "summary_text": "2–3 sentence overview of how people think about this question",
  "clusters": [
    {
      "title": "Short cluster name (3–6 words)",
      "description": "1–2 sentence summary of this group's reasoning",
      "estimated_count": number
    }
  ]
}

Rules:
- Produce 3–6 clusters when possible; fewer only if responses are very homogeneous.
- estimated_count should approximate how many responses fit each cluster (sums may exceed total if overlap).
- Be neutral and insightful, not judgmental.
- Do not invent responses; only use provided data.`;

function parseInsightPayload(raw: unknown): InsightPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const parsed = raw as InsightPayload;

  if (
    typeof parsed.summary_text !== "string" ||
    !Array.isArray(parsed.clusters)
  ) {
    return null;
  }

  const clusters: ReasoningCluster[] = parsed.clusters
    .filter(
      (c) =>
        typeof c.title === "string" && typeof c.description === "string",
    )
    .slice(0, 6)
    .map((c) => ({
      title: c.title.trim(),
      description: c.description.trim(),
      estimated_count:
        typeof c.estimated_count === "number" ? c.estimated_count : undefined,
    }));

  if (clusters.length === 0) return null;

  return {
    summary_text: parsed.summary_text.trim(),
    clusters,
  };
}

async function callHostedLlm(
  question: Pick<Question, "text" | "species">,
  responses: ResponseWithUser[],
): Promise<InsightPayload | null> {
  if (!isHostedLlmConfigured()) return null;

  const content = await hostedChatJson([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildPrompt(question, responses) },
  ]);

  if (!content) return null;

  try {
    return parseInsightPayload(JSON.parse(content));
  } catch {
    console.error("Hosted LLM returned invalid JSON");
    return null;
  }
}

async function generateInsights(
  question: Question,
  responses: ResponseWithUser[],
): Promise<InsightPayload> {
  const fromLlm = await callHostedLlm(question, responses);
  if (fromLlm) return fromLlm;

  return generateHeuristicInsights(question, responses);
}

export async function getOrGenerateInsights(
  question: Question,
  responses: ResponseWithUser[],
): Promise<InsightResult> {
  const cached = await getQuestionInsight(question.id);
  if (cached && cached.clusters.length > 0) {
    return {
      status: "cached",
      summary_text: cached.summary_text,
      clusters: cached.clusters,
    };
  }

  if (responses.length < MIN_RESPONSES_FOR_INSIGHTS) {
    return { status: "insufficient_data" };
  }

  try {
    const generated = await generateInsights(question, responses);

    const saved = await saveQuestionInsight(
      question.id,
      generated.summary_text,
      generated.clusters,
    );

    if (!saved) {
      return {
        status: "ready",
        summary_text: generated.summary_text,
        clusters: generated.clusters,
      };
    }

    return {
      status: "ready",
      summary_text: generated.summary_text,
      clusters: generated.clusters,
    };
  } catch (error) {
    console.error("Insight generation failed:", error);
    return {
      status: "unavailable",
      reason: "Could not generate insights right now. Try again later.",
    };
  }
}
