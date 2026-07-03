import type { Question } from "@/types";
import { FEED_DISPLAY_LIMIT } from "./feed-config";

export type FeedBadge =
  | "trending"
  | "popular"
  | "controversial"
  | "challenge";

export interface QuestionFeedSignals {
  responseCount: number;
  friendsAnsweredCount: number;
  friendsAnsweredPercent: number | null;
  badges: FeedBadge[];
  opposingClusters: string[];
  isChallenge: boolean;
  antiEchoScore: number;
}

export interface FeedSignalsMap {
  [questionId: string]: QuestionFeedSignals;
}

interface ResponseStats {
  p75Responses: number;
}

function percentile75(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(index, sorted.length - 1)] ?? 0;
}

export function buildFeedSignalsMap(
  questions: Question[],
  rows: {
    question_id: string;
    response_count: number;
    friends_answered: number;
  }[],
  followingCount: number,
): FeedSignalsMap {
  const rowMap = new Map(rows.map((r) => [r.question_id, r]));
  const responseCounts = rows.map((r) => Number(r.response_count));
  const stats: ResponseStats = { p75Responses: percentile75(responseCounts) };

  const result: FeedSignalsMap = {};

  for (const question of questions) {
    const row = rowMap.get(question.id);
    const responseCount = Number(row?.response_count ?? 0);
    const friendsAnsweredCount = Number(row?.friends_answered ?? 0);

    const friendsAnsweredPercent =
      followingCount > 0
        ? Math.round((friendsAnsweredCount / followingCount) * 100)
        : null;

    result[question.id] = {
      responseCount,
      friendsAnsweredCount,
      friendsAnsweredPercent,
      badges: computeBadges(question, responseCount, stats),
      opposingClusters: [],
      isChallenge: false,
      antiEchoScore: 0,
    };
  }

  return result;
}

function computeBadges(
  question: Question,
  responseCount: number,
  stats: ResponseStats,
): FeedBadge[] {
  const badges: FeedBadge[] = [];

  if (question.upvotes >= 100 && responseCount >= 3) {
    badges.push("popular");
  }

  const trendingThreshold = Math.max(5, stats.p75Responses);
  if (
    responseCount >= trendingThreshold &&
    (responseCount >= 8 || question.upvotes >= 200)
  ) {
    badges.push("trending");
  }

  if (
    responseCount >= 4 &&
    responseCount >= trendingThreshold &&
    question.upvotes < 80
  ) {
    badges.push("controversial");
  }

  return badges;
}

/** Higher = more engagement. Answers weighted above upvotes. */
export function engagementScore(
  question: Question,
  signals: QuestionFeedSignals | undefined,
): number {
  const responses = signals?.responseCount ?? 0;
  const upvotes = question.upvotes ?? 0;
  return responses * 10 + upvotes;
}

export function hasFeedEngagement(
  question: Question,
  signals: QuestionFeedSignals | undefined,
): boolean {
  return engagementScore(question, signals) > 0;
}

/** Community-submitted vs seeded stock questions. */
export function isCommunityQuestion(question: Question): boolean {
  return question.created_by !== null;
}

/** Stable pseudo-random key for shuffle (consistent within a session). */
function pseudoRandomKey(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function shuffleByPseudoRandom<T extends Question>(questions: T[]): T[] {
  return [...questions].sort(
    (a, b) => pseudoRandomKey(a.id) - pseudoRandomKey(b.id),
  );
}

export function compareByEngagement<T extends Question>(
  a: T,
  b: T,
  signalsMap: FeedSignalsMap,
): number {
  return (
    engagementScore(b, signalsMap[b.id]) -
    engagementScore(a, signalsMap[a.id])
  );
}

export function sortQuestionsByEngagement<T extends Question>(
  questions: T[],
  signalsMap: FeedSignalsMap,
): T[] {
  return [...questions].sort((a, b) => compareByEngagement(a, b, signalsMap));
}

/**
 * Feed order:
 * 1. Questions with engagement (responses/upvotes), highest first
 * 2. Community-submitted with no engagement, shuffled
 * 3. Stock/seed with no engagement, shuffled
 */
export function orderFeedQuestions<T extends Question>(
  questions: T[],
  signalsMap: FeedSignalsMap,
  limit = FEED_DISPLAY_LIMIT,
): T[] {
  const engaged: T[] = [];
  const communityIdle: T[] = [];
  const stockIdle: T[] = [];

  for (const question of questions) {
    const signals = signalsMap[question.id];
    if (hasFeedEngagement(question, signals)) {
      engaged.push(question);
    } else if (isCommunityQuestion(question)) {
      communityIdle.push(question);
    } else {
      stockIdle.push(question);
    }
  }

  return [
    ...sortQuestionsByEngagement(engaged, signalsMap),
    ...shuffleByPseudoRandom(communityIdle),
    ...shuffleByPseudoRandom(stockIdle),
  ].slice(0, limit);
}

export const BADGE_STYLES: Record<
  FeedBadge,
  { label: string; className: string }
> = {
  trending: {
    label: "Trending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  popular: {
    label: "Popular",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  controversial: {
    label: "Controversial",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  challenge: {
    label: "Outside your bubble",
    className:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  },
};
