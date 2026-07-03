import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import type { Question } from "@/types";
import { formatPublicDisplayName } from "@/features/social/user-display";

export interface QuestionAuthor {
  id: string;
  displayName: string;
}

export type EnrichedQuestion = Question & {
  author: QuestionAuthor | null;
};

async function getAuthorsById(
  creatorIds: string[],
): Promise<Map<string, QuestionAuthor>> {
  if (creatorIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", creatorIds);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch question authors:", error.message);
    }
    return new Map();
  }

  const map = new Map<string, QuestionAuthor>();
  for (const row of data ?? []) {
    map.set(row.id, {
      id: row.id,
      displayName: formatPublicDisplayName({ display_name: row.display_name }),
    });
  }
  return map;
}

/** Submitter info for feed cards. Upvotes use questions.upvotes (kept in sync by DB trigger). */
export async function enrichQuestionsForFeed(
  questions: Question[],
): Promise<EnrichedQuestion[]> {
  if (questions.length === 0) return [];

  const creatorIds = [
    ...new Set(
      questions
        .map((question) => question.created_by)
        .filter((id): id is string => id !== null),
    ),
  ];

  const authors = await getAuthorsById(creatorIds);

  return questions.map((question) => ({
    ...question,
    author: question.created_by
      ? (authors.get(question.created_by) ?? {
          id: question.created_by,
          displayName: "User",
        })
      : null,
  }));
}

export async function enrichQuestion(
  question: Question,
): Promise<EnrichedQuestion> {
  const [enriched] = await enrichQuestionsForFeed([question]);
  return enriched ?? { ...question, author: null };
}
