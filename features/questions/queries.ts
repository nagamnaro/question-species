import { createClient } from "@/lib/supabase/server";
import type { Question, Species } from "@/types";
import {
  FEED_CANDIDATE_LIMIT,
  FEED_DISPLAY_LIMIT,
} from "./feed-config";

const SPECIES_VALUES: Species[] = [
  "puzzle",
  "opinion",
  "prediction",
  "estimation",
  "brainstorm",
];

export function parseSpeciesFilter(value?: string): Species | null {
  if (!value || value === "all") return null;
  return SPECIES_VALUES.includes(value as Species) ? (value as Species) : null;
}

export async function getQuestions(
  species?: Species | null,
): Promise<Question[]> {
  const supabase = await createClient();

  let query = supabase.from("questions").select("*");

  if (species) {
    query = query
      .eq("species", species)
      .order("upvotes", { ascending: false })
      .limit(FEED_DISPLAY_LIMIT);
  } else {
    query = query
      .order("upvotes", { ascending: false })
      .limit(FEED_CANDIDATE_LIMIT);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch questions:", error.message);
    return [];
  }

  const questions = data ?? [];

  if (!species) {
    return questions.slice(0, FEED_DISPLAY_LIMIT);
  }

  return questions;
}

export interface FeedSocialStatsRow {
  question_id: string;
  response_count: number;
  friends_answered: number;
}

export async function getFeedSocialStats(
  questionIds: string[],
  friendIds: string[] = [],
): Promise<FeedSocialStatsRow[]> {
  if (questionIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_feed_social_stats", {
    p_question_ids: questionIds,
    p_friend_ids: friendIds,
  });

  if (error) {
    console.error("Failed to fetch feed social stats:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    question_id: row.question_id,
    response_count: Number(row.response_count),
    friends_answered: Number(row.friends_answered),
  }));
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch question:", error.message);
    return null;
  }

  return data;
}

export async function getAnsweredQuestionIds(
  userId: string,
): Promise<Set<string>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("question_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch answered questions:", error.message);
    return new Set();
  }

  return new Set(data?.map((row) => row.question_id) ?? []);
}

/** Next unanswered question, preferring the same species. */
export async function getNextQuestion(
  currentQuestionId: string,
  userId: string,
  species: Species,
): Promise<Question | null> {
  const supabase = await createClient();

  const { data: answered } = await supabase
    .from("responses")
    .select("question_id")
    .eq("user_id", userId);

  const answeredIds = new Set(
    answered?.map((row) => row.question_id) ?? [],
  );
  answeredIds.add(currentQuestionId);

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error || !questions?.length) return null;

  const unanswered = questions.filter((q) => !answeredIds.has(q.id));
  if (unanswered.length === 0) return null;

  return (
    unanswered.find((q) => q.species === species) ?? unanswered[0] ?? null
  );
}
