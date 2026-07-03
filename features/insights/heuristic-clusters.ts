import { answersAgree } from "@/features/responses/comparison";
import { isNumericPredictionQuestion } from "@/features/responses/prediction-format";
import type { Question, Species } from "@/types";
import type { ResponseWithUser } from "@/features/responses/queries";
import type { InsightPayload, ReasoningCluster } from "./types";

function truncate(text: string, max = 48): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function clusterResponses(
  responses: ResponseWithUser[],
  species: Species,
  questionText: string,
): ResponseWithUser[][] {
  const clusters: ResponseWithUser[][] = [];

  for (const response of responses) {
    const existing = clusters.find((cluster) =>
      answersAgree(
        response.answer_text,
        cluster[0]!.answer_text,
        species,
        questionText,
      ),
    );

    if (existing) {
      existing.push(response);
    } else {
      clusters.push([response]);
    }
  }

  return clusters.sort((a, b) => b.length - a.length);
}

function clusterTitle(
  cluster: ResponseWithUser[],
  species: Species,
  questionText: string,
  index: number,
): string {
  const representative = cluster[0]!.answer_text.trim();

  if (
    species === "estimation" ||
    (species === "prediction" && isNumericPredictionQuestion(questionText))
  ) {
    return `Around ${truncate(representative, 20)}`;
  }

  if (representative.length <= 32) {
    return truncate(representative, 32);
  }

  return `Viewpoint ${index + 1}`;
}

function clusterDescription(cluster: ResponseWithUser[]): string {
  const count = cluster.length;
  const reasoning = cluster
    .map((response) => response.reasoning_text?.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (reasoning.length > 0) {
    return `${count} similar answer${count !== 1 ? "s" : ""}. Example reasoning: "${truncate(reasoning[0]!, 120)}"`;
  }

  return `${count} respondent${count !== 1 ? "s" : ""} gave closely matching answers.`;
}

function buildSummary(
  question: Pick<Question, "text" | "species">,
  clusters: ReasoningCluster[],
  total: number,
): string {
  if (clusters.length === 1) {
    return `Responses to this ${question.species} question are largely aligned — one main pattern covers most of the ${total} answers so far.`;
  }

  const largest = clusters[0];
  const largestShare =
    largest?.estimated_count && total > 0
      ? Math.round((largest.estimated_count / total) * 100)
      : 0;

  return `${clusters.length} distinct answer patterns emerged among ${total} responses. The largest group represents about ${largestShare}% of answers, with meaningful variation across the rest.`;
}

export function generateHeuristicInsights(
  question: Pick<Question, "text" | "species">,
  responses: ResponseWithUser[],
): InsightPayload {
  const grouped = clusterResponses(responses, question.species, question.text);

  const clusters: ReasoningCluster[] = grouped.slice(0, 6).map((cluster, index) => ({
    title: clusterTitle(cluster, question.species, question.text, index),
    description: clusterDescription(cluster),
    estimated_count: cluster.length,
  }));

  return {
    summary_text: buildSummary(question, clusters, responses.length),
    clusters,
  };
}
