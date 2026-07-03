import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export async function getUserUpvotedQuestionIds(
  userId: string,
  questionIds: string[],
): Promise<Set<string>> {
  if (questionIds.length === 0) return new Set();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_upvotes")
    .select("question_id")
    .eq("user_id", userId)
    .in("question_id", questionIds);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch user upvotes:", error.message);
    }
    return new Set();
  }

  return new Set(data?.map((row) => row.question_id) ?? []);
}

export async function hasUserUpvotedQuestion(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_upvotes")
    .select("question_id")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to check upvote:", error.message);
    }
    return false;
  }

  return data !== null;
}

/** Count actual rows in question_upvotes (ignores fake seed values on questions.upvotes). */
export async function getRealUpvoteCounts(
  questionIds: string[],
): Promise<Record<string, number>> {
  if (questionIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_upvotes")
    .select("question_id")
    .in("question_id", questionIds);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch upvote counts:", error.message);
    }
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.question_id] = (counts[row.question_id] ?? 0) + 1;
  }

  return counts;
}
