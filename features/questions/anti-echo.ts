import type { Question, Species } from "@/types";
import { computeComparison } from "@/features/responses/comparison";
import type { ResponseWithUser } from "@/features/responses/queries";
import { getUserAnsweredQuestionIds } from "@/features/responses/queries";
import type { ReasoningCluster } from "@/features/insights/types";
import { createClient } from "@/lib/supabase/server";
import { getResponsesForQuestions } from "@/features/mind-match/queries";
import { ECHO_PROFILE_SAMPLE_LIMIT } from "./feed-config";
import type { QuestionFeedSignals } from "./feed-signals";

const CHALLENGE_SCORE_THRESHOLD = 35;
const INTERLEAVE_EVERY = 4;

const SPECIES_FALLBACK_LABELS: Record<Species, [string, string]> = {
  puzzle: ["Literal reading", "Alternative framing"],
  opinion: ["Mainstream view", "Contrarian take"],
  prediction: ["Higher consensus", "Lower consensus"],
  estimation: ["Lower estimates", "Higher estimates"],
  brainstorm: ["Conventional ideas", "Unusual ideas"],
};

/** Placeholder opposing clusters when insight cache is empty (anti-echo cold start). */
export function deriveFallbackClusterLabels(question: Question): string[] {
  const tagLabels = question.tags
    .filter((tag) => tag.length > 1)
    .slice(0, 2)
    .map((tag) => `${tag.charAt(0).toUpperCase()}${tag.slice(1)} angle`);

  if (tagLabels.length >= 2) return tagLabels;

  const [a, b] = SPECIES_FALLBACK_LABELS[question.species];
  return tagLabels.length === 1 ? [tagLabels[0]!, b] : [a, b];
}

function fallbackClusters(question: Question): ReasoningCluster[] {
  return deriveFallbackClusterLabels(question).map((title) => ({
    title,
    description: "Exploratory cluster — insights will refine as more people answer.",
    estimated_count: 1,
  }));
}

export interface UserEchoProfile {
  answeredIds: Set<string>;
  topSpecies: Species[];
  majorityRate: number;
}

type RawResponseRow = {
  user_id: string;
  question_id: string;
  answer_text: string;
  questions: { species: Species } | null;
};

export function buildUserEchoProfile(
  userId: string,
  userResponses: RawResponseRow[],
  allResponses: RawResponseRow[],
): UserEchoProfile {
  const answeredIds = new Set(userResponses.map((r) => r.question_id));
  const speciesCounts: Partial<Record<Species, number>> = {};

  for (const response of userResponses) {
    const species = response.questions?.species;
    if (!species) continue;
    speciesCounts[species] = (speciesCounts[species] ?? 0) + 1;
  }

  const topSpecies = (
    Object.entries(speciesCounts) as [Species, number][]
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([species]) => species);

  const responsesByQuestion = new Map<string, RawResponseRow[]>();
  for (const response of allResponses) {
    const existing = responsesByQuestion.get(response.question_id) ?? [];
    existing.push(response);
    responsesByQuestion.set(response.question_id, existing);
  }

  let majorityCount = 0;
  let comparedCount = 0;

  for (const userResponse of userResponses) {
    const species = userResponse.questions?.species;
    if (!species) continue;

    const questionResponses = responsesByQuestion.get(userResponse.question_id);
    if (!questionResponses || questionResponses.length < 2) continue;

    const asResponseWithUser = questionResponses.map((row) => ({
      id: "",
      user_id: row.user_id,
      question_id: row.question_id,
      answer_text: row.answer_text,
      reasoning_text: null,
      prediction_value: null,
      created_at: "",
      updated_at: "",
      users: null,
    })) as ResponseWithUser[];

    const self = asResponseWithUser.find((r) => r.user_id === userId);
    if (!self) continue;

    const comparison = computeComparison(
      { species },
      self,
      asResponseWithUser,
      [],
    );

    if (comparison.global.totalOthers > 0) {
      comparedCount += 1;
      if (comparison.global.stance === "majority") {
        majorityCount += 1;
      }
    }
  }

  const majorityRate =
    comparedCount > 0 ? Math.round((majorityCount / comparedCount) * 100) : 50;

  return { answeredIds, topSpecies, majorityRate };
}

type EchoSampleRow = {
  user_id: string;
  question_id: string;
  answer_text: string;
  questions: { species: Species } | null;
};

/** Lightweight anti-echo profile: full answered-id set, sampled majority calculation. */
export async function buildEchoProfileForUser(
  userId: string,
): Promise<UserEchoProfile | null> {
  const supabase = await createClient();

  const [answeredIds, { data: recentRows, error }] = await Promise.all([
    getUserAnsweredQuestionIds(userId),
    supabase
      .from("responses")
      .select("user_id, question_id, answer_text, questions(species)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(ECHO_PROFILE_SAMPLE_LIMIT),
  ]);

  if (answeredIds.length === 0) return null;

  if (error) {
    console.error("Failed to fetch echo profile sample:", error.message);
    return {
      answeredIds: new Set(answeredIds),
      topSpecies: [],
      majorityRate: 50,
    };
  }

  const userResponses = (recentRows ?? []) as EchoSampleRow[];
  if (userResponses.length === 0) {
    return {
      answeredIds: new Set(answeredIds),
      topSpecies: [],
      majorityRate: 50,
    };
  }

  const sampleQuestionIds = userResponses.map((row) => row.question_id);
  const allResponsesRaw = await getResponsesForQuestions(sampleQuestionIds);

  const allResponses: EchoSampleRow[] = allResponsesRaw.map((row) => ({
    user_id: row.userId,
    question_id: row.questionId,
    answer_text: row.answerText,
    questions: { species: row.species },
  }));

  const profile = buildUserEchoProfile(userId, userResponses, allResponses);

  return {
    ...profile,
    answeredIds: new Set(answeredIds),
  };
}

export function getOpposingClusterTitles(
  clusters: ReasoningCluster[],
): string[] {
  if (clusters.length < 2) return [];

  return [...clusters]
    .sort(
      (a, b) => (b.estimated_count ?? 0) - (a.estimated_count ?? 0),
    )
    .slice(0, 2)
    .map((cluster) => cluster.title);
}

export function scoreAntiEchoQuestion(
  question: Question,
  signals: QuestionFeedSignals,
  clusters: ReasoningCluster[],
  profile: UserEchoProfile | null,
): number {
  if (profile?.answeredIds.has(question.id)) return 0;

  let score = 0;

  if (clusters.length >= 2) {
    score += 20 + Math.min(clusters.length, 5) * 4;
  }

  if (signals.badges.includes("controversial")) {
    score += 25;
  }

  if (signals.responseCount >= 5) {
    score += 10;
  }

  if (profile) {
    if (!profile.topSpecies.includes(question.species)) {
      score += 30;
    }

    if (profile.majorityRate >= 60) {
      score += 15;
    }
  }

  return score;
}

export function enrichSignalsWithAntiEcho(
  questions: Question[],
  signalsMap: Record<string, QuestionFeedSignals>,
  clusterMap: Map<string, ReasoningCluster[]>,
  profile: UserEchoProfile | null,
): Record<string, QuestionFeedSignals> {
  const enriched: Record<string, QuestionFeedSignals> = {};

  for (const question of questions) {
    const base = signalsMap[question.id];
    if (!base) continue;

    let clusters = clusterMap.get(question.id) ?? [];
    if (clusters.length < 2) {
      clusters = fallbackClusters(question);
    }

    const opposingClusters = getOpposingClusterTitles(clusters);
    const antiEchoScore = scoreAntiEchoQuestion(
      question,
      base,
      clusters,
      profile,
    );
    const isChallenge = antiEchoScore >= CHALLENGE_SCORE_THRESHOLD;

    const badges = [...base.badges];
    if (isChallenge && !badges.includes("challenge")) {
      badges.push("challenge");
    }

    enriched[question.id] = {
      ...base,
      badges,
      opposingClusters,
      isChallenge,
      antiEchoScore,
    };
  }

  return enriched;
}

function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function diversifyFeedOrder<T extends Question>(
  questions: T[],
  signalsMap: Record<string, QuestionFeedSignals>,
  profile: UserEchoProfile | null,
): T[] {
  if (!profile) {
    return diversifyFeedOrderAnonymous(questions, signalsMap);
  }

  const answered = questions.filter((q) => profile.answeredIds.has(q.id));
  const unanswered = questions.filter((q) => !profile.answeredIds.has(q.id));

  const challenge = unanswered
    .filter((q) => signalsMap[q.id]?.isChallenge)
    .sort(
      (a, b) =>
        (signalsMap[b.id]?.antiEchoScore ?? 0) -
        (signalsMap[a.id]?.antiEchoScore ?? 0),
    );

  const challengeIds = new Set(challenge.map((q) => q.id));
  const regularPool = unanswered.filter((q) => !challengeIds.has(q.id));
  const regular = shuffleQuestions(
    [...regularPool].sort(
      (a, b) =>
        (signalsMap[b.id]?.antiEchoScore ?? 0) -
        (signalsMap[a.id]?.antiEchoScore ?? 0),
    ),
  );

  const merged: T[] = [];
  let challengeIndex = 0;
  let regularIndex = 0;

  while (challengeIndex < challenge.length || regularIndex < regular.length) {
    const shouldInsertChallenge =
      merged.length % INTERLEAVE_EVERY === 0 &&
      challengeIndex < challenge.length;

    if (shouldInsertChallenge) {
      merged.push(challenge[challengeIndex]!);
      challengeIndex += 1;
    } else if (regularIndex < regular.length) {
      merged.push(regular[regularIndex]!);
      regularIndex += 1;
    } else if (challengeIndex < challenge.length) {
      merged.push(challenge[challengeIndex]!);
      challengeIndex += 1;
    }
  }

  return [...merged, ...shuffleQuestions(answered)];
}

function diversifyFeedOrderAnonymous<T extends Question>(
  questions: T[],
  signalsMap: Record<string, QuestionFeedSignals>,
): T[] {
  const withOpposing = questions.filter(
    (q) => (signalsMap[q.id]?.opposingClusters.length ?? 0) >= 2,
  );
  const opposingIds = new Set(withOpposing.map((q) => q.id));
  const rest = shuffleQuestions(questions.filter((q) => !opposingIds.has(q.id)));

  const merged: T[] = [];
  let opposingIndex = 0;
  let restIndex = 0;

  while (opposingIndex < withOpposing.length || restIndex < rest.length) {
    if (merged.length % INTERLEAVE_EVERY === 0 && opposingIndex < withOpposing.length) {
      merged.push(withOpposing[opposingIndex]!);
      opposingIndex += 1;
    } else if (restIndex < rest.length) {
      merged.push(rest[restIndex]!);
      restIndex += 1;
    } else if (opposingIndex < withOpposing.length) {
      merged.push(withOpposing[opposingIndex]!);
      opposingIndex += 1;
    }
  }

  return merged;
}

/** Lighter anti-echo interleaving for species-filtered feeds. */
export function diversifySpeciesFeedOrder<T extends Question>(
  questions: T[],
  signalsMap: Record<string, QuestionFeedSignals>,
  profile: UserEchoProfile | null,
): T[] {
  if (questions.length <= 2) return questions;

  const unanswered = profile
    ? questions.filter((q) => !profile.answeredIds.has(q.id))
    : questions;

  const challenge = unanswered
    .filter((q) => signalsMap[q.id]?.isChallenge)
    .sort(
      (a, b) =>
        (signalsMap[b.id]?.antiEchoScore ?? 0) -
        (signalsMap[a.id]?.antiEchoScore ?? 0),
    )
    .slice(0, 2);

  if (challenge.length === 0) {
    return profile
      ? [
          ...unanswered,
          ...questions.filter((q) => profile.answeredIds.has(q.id)),
        ]
      : questions;
  }

  const challengeIds = new Set(challenge.map((q) => q.id));
  const rest = questions.filter((q) => !challengeIds.has(q.id));
  const merged = [...rest];

  if (challenge[0]) merged.unshift(challenge[0]);
  if (challenge[1] && merged.length >= 4) {
    merged.splice(4, 0, challenge[1]);
  } else if (challenge[1]) {
    merged.push(challenge[1]);
  }

  return merged;
}
