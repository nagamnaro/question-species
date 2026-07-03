import { createClient } from "@/lib/supabase/server";
import type { Response } from "@/types";
import type { PublicUserFields } from "@/features/social/user-display";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export type ResponseWithUser = Response & {
  users: PublicUserFields | null;
};

export async function getCurrentUserResponse(
  questionId: string,
): Promise<Response | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user response:", error.message);
    return null;
  }

  return data;
}

export async function getQuestionResponses(
  questionId: string,
): Promise<ResponseWithUser[]> {
  const supabase = await createClient();

  const withBio = await supabase
    .from("responses")
    .select("*, users(display_name, avatar_url, bio)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (!withBio.error) {
    return (withBio.data ?? []) as ResponseWithUser[];
  }

  if (isMissingSchemaError(withBio.error.message)) {
    const fallback = await supabase
      .from("responses")
      .select("*, users(display_name, avatar_url)")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true });

    if (!fallback.error) {
      return (fallback.data ?? []) as ResponseWithUser[];
    }

    if (!isMissingSchemaError(fallback.error.message)) {
      console.error("Failed to fetch responses:", fallback.error.message);
    }
    return [];
  }

  console.error("Failed to fetch responses:", withBio.error.message);
  return [];
}

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getUserAnsweredQuestionIds(
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("responses")
    .select("question_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch answered question ids:", error.message);
    return [];
  }

  return data?.map((row) => row.question_id) ?? [];
}
