import { answersAgree } from "@/features/responses/comparison";
import type { MindMatch, PairAgreement, ResponseForMatch } from "./types";

const MIN_SHARED = 3;
const ALIGN_THRESHOLD = 65;
const SPARK_MIN = 25;
const SPARK_MAX = 55;

export function computePairAgreement(
  left: ResponseForMatch[],
  right: ResponseForMatch[],
): PairAgreement | null {
  const rightByQuestion = new Map(
    right.map((response) => [response.questionId, response]),
  );

  let sharedCount = 0;
  let agreeCount = 0;

  for (const leftResponse of left) {
    const rightResponse = rightByQuestion.get(leftResponse.questionId);
    if (!rightResponse) continue;

    sharedCount += 1;
    if (
      answersAgree(
        leftResponse.answerText,
        rightResponse.answerText,
        leftResponse.species,
      )
    ) {
      agreeCount += 1;
    }
  }

  if (sharedCount === 0) return null;

  return {
    userId: right[0]?.userId ?? "",
    displayName: right[0]?.displayName ?? "User",
    agreementPercent: Math.round((agreeCount / sharedCount) * 100),
    sharedCount,
    agreeCount,
  };
}

function classifyMatch(pair: PairAgreement): MindMatch | null {
  if (pair.sharedCount < MIN_SHARED) return null;

  if (pair.agreementPercent >= ALIGN_THRESHOLD) {
    return { ...pair, kind: "align" };
  }

  if (
    pair.agreementPercent >= SPARK_MIN &&
    pair.agreementPercent <= SPARK_MAX
  ) {
    return { ...pair, kind: "spark" };
  }

  return null;
}

export function computeMindMatches(
  currentUserId: string,
  currentResponses: ResponseForMatch[],
  allResponses: ResponseForMatch[],
): { align: MindMatch[]; spark: MindMatch[] } {
  const byUser = new Map<string, ResponseForMatch[]>();

  for (const response of allResponses) {
    if (response.userId === currentUserId) continue;
    const existing = byUser.get(response.userId) ?? [];
    existing.push(response);
    byUser.set(response.userId, existing);
  }

  const align: MindMatch[] = [];
  const spark: MindMatch[] = [];

  for (const responses of byUser.values()) {
    const pair = computePairAgreement(currentResponses, responses);
    if (!pair) continue;

    const match = classifyMatch(pair);
    if (!match) continue;

    if (match.kind === "align") {
      align.push(match);
    } else {
      spark.push(match);
    }
  }

  align.sort(
    (a, b) =>
      b.agreementPercent - a.agreementPercent || b.sharedCount - a.sharedCount,
  );
  spark.sort(
    (a, b) =>
      b.sharedCount - a.sharedCount ||
      Math.abs(40 - a.agreementPercent) - Math.abs(40 - b.agreementPercent),
  );

  return { align, spark };
}

export function computeAgreementMap(
  currentUserId: string,
  currentResponses: ResponseForMatch[],
  allResponses: ResponseForMatch[],
  limit = 8,
): PairAgreement[] {
  const byUser = new Map<string, ResponseForMatch[]>();

  for (const response of allResponses) {
    if (response.userId === currentUserId) continue;
    const existing = byUser.get(response.userId) ?? [];
    existing.push(response);
    byUser.set(response.userId, existing);
  }

  const pairs: PairAgreement[] = [];

  for (const responses of byUser.values()) {
    const pair = computePairAgreement(currentResponses, responses);
    if (!pair || pair.sharedCount < MIN_SHARED) continue;
    pairs.push(pair);
  }

  return pairs
    .sort(
      (a, b) =>
        b.sharedCount - a.sharedCount ||
        b.agreementPercent - a.agreementPercent,
    )
    .slice(0, limit);
}
