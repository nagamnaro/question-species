import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import { formatPublicDisplayName } from "@/features/social/user-display";
import { PUBLIC_USER_EMBED_MINIMAL } from "@/features/social/public-user-select";
import type { Species } from "@/types";
import {
  computeAgreementMap,
  computeMindMatches,
  computePairAgreement,
} from "./compute";
import type { MindMatch, ResponseForMatch } from "./types";

type RawResponseRow = {
  user_id: string;
  question_id: string;
  answer_text: string;
  users: { display_name: string | null } | null;
  questions: { species: Species } | null;
};

function mapResponseRow(row: RawResponseRow): ResponseForMatch | null {
  if (!row.questions?.species) return null;

  return {
    userId: row.user_id,
    questionId: row.question_id,
    species: row.questions.species,
    answerText: row.answer_text,
    displayName: formatPublicDisplayName(row.users),
  };
}

export async function getUserResponsesForMatch(
  userId: string,
): Promise<ResponseForMatch[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select(
      `user_id, question_id, answer_text, users(${PUBLIC_USER_EMBED_MINIMAL}), questions(species)`,
    )
    .eq("user_id", userId);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch user responses for match:", error.message);
    }
    return [];
  }

  return (data as RawResponseRow[])
    .map(mapResponseRow)
    .filter((row): row is ResponseForMatch => row !== null);
}

export async function getResponsesForQuestions(
  questionIds: string[],
): Promise<ResponseForMatch[]> {
  if (questionIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select(
      `user_id, question_id, answer_text, users(${PUBLIC_USER_EMBED_MINIMAL}), questions(species)`,
    )
    .in("question_id", questionIds);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch responses for questions:", error.message);
    }
    return [];
  }

  return (data as RawResponseRow[])
    .map(mapResponseRow)
    .filter((row): row is ResponseForMatch => row !== null);
}

export async function getMindMatchesForUser(userId: string): Promise<{
  align: MindMatch[];
  spark: MindMatch[];
  answeredCount: number;
}> {
  const userResponses = await getUserResponsesForMatch(userId);
  const questionIds = [...new Set(userResponses.map((r) => r.questionId))];
  const allResponses = await getResponsesForQuestions(questionIds);
  const { align, spark } = computeMindMatches(
    userId,
    userResponses,
    allResponses,
  );

  return { align, spark, answeredCount: userResponses.length };
}

export async function getAgreementMapForUser(
  userId: string,
  limit = 8,
) {
  const userResponses = await getUserResponsesForMatch(userId);
  const questionIds = [...new Set(userResponses.map((r) => r.questionId))];
  const allResponses = await getResponsesForQuestions(questionIds);

  return {
    entries: computeAgreementMap(userId, userResponses, allResponses, limit),
    answeredCount: userResponses.length,
  };
}

export async function getPairAgreementWithUser(
  currentUserId: string,
  otherUserId: string,
) {
  const [currentResponses, otherResponses] = await Promise.all([
    getUserResponsesForMatch(currentUserId),
    getUserResponsesForMatch(otherUserId),
  ]);

  const sharedQuestionIds = new Set(
    otherResponses.map((response) => response.questionId),
  );
  const overlapping = currentResponses.filter((response) =>
    sharedQuestionIds.has(response.questionId),
  );

  if (overlapping.length === 0) return null;

  return computePairAgreement(overlapping, otherResponses);
}
