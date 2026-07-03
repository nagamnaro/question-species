import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import { formatPublicDisplayName } from "@/features/social/user-display";
import type { ReactionType } from "./social-actions";

export interface ResponseReplyView {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  createdAt: string;
}

export interface ReactionCounts {
  agree: number;
  disagree: number;
}

export interface ResponseSocialData {
  reactions: Record<string, ReactionType>;
  reactionCounts: Record<string, ReactionCounts>;
  replies: Record<string, ResponseReplyView[]>;
}

const EMPTY: ResponseSocialData = {
  reactions: {},
  reactionCounts: {},
  replies: {},
};

import { PUBLIC_USER_EMBED_MINIMAL } from "@/features/social/public-user-select";

export async function getResponseSocialData(
  responseIds: string[],
  currentUserId: string,
): Promise<ResponseSocialData> {
  if (responseIds.length === 0) {
    return EMPTY;
  }

  const supabase = await createClient();

  const [reactionsResult, repliesResult, countsResult] = await Promise.all([
    supabase
      .from("response_reactions")
      .select("response_id, reaction")
      .eq("user_id", currentUserId)
      .in("response_id", responseIds),
    supabase
      .from("response_replies")
      .select(
        `id, response_id, text, user_id, created_at, users(${PUBLIC_USER_EMBED_MINIMAL})`,
      )
      .in("response_id", responseIds)
      .order("created_at", { ascending: true }),
    supabase.rpc("get_response_reaction_counts", {
      p_response_ids: responseIds,
    }),
  ]);

  if (
    reactionsResult.error &&
    isMissingSchemaError(reactionsResult.error.message)
  ) {
    return EMPTY;
  }

  if (
    repliesResult.error &&
    isMissingSchemaError(repliesResult.error.message)
  ) {
    return EMPTY;
  }

  const reactions: Record<string, ReactionType> = {};
  for (const row of reactionsResult.data ?? []) {
    reactions[row.response_id] = row.reaction as ReactionType;
  }

  const reactionCounts: Record<string, ReactionCounts> = {};
  if (!countsResult.error) {
    for (const row of countsResult.data ?? []) {
      reactionCounts[row.response_id] = {
        agree: Number(row.agree_count ?? 0),
        disagree: Number(row.disagree_count ?? 0),
      };
    }
  }

  const replies: Record<string, ResponseReplyView[]> = {};
  for (const row of repliesResult.data ?? []) {
    const user = row.users as {
      display_name: string | null;
    } | null;
    const view: ResponseReplyView = {
      id: row.id,
      text: row.text,
      userId: row.user_id,
      displayName: formatPublicDisplayName(user),
      createdAt: row.created_at,
    };
    const list = replies[row.response_id] ?? [];
    list.push(view);
    replies[row.response_id] = list;
  }

  return { reactions, reactionCounts, replies };
}

export interface ReasoningSnippet {
  questionText: string;
  reasoning: string;
  createdAt: string;
}

export async function getRecentReasoning(
  userId: string,
  limit = 3,
): Promise<ReasoningSnippet[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("reasoning_text, created_at, questions(text)")
    .eq("user_id", userId)
    .not("reasoning_text", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch recent reasoning:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.reasoning_text?.trim())
    .map((row) => ({
      questionText:
        (row.questions as { text: string } | null)?.text ?? "Question",
      reasoning: row.reasoning_text!.trim(),
      createdAt: row.created_at,
    }));
}
