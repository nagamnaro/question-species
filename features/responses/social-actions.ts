"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export type ReactionType = "agree" | "disagree";

export interface SocialActionResult {
  success: boolean;
  error?: string;
}

export async function setResponseReaction(
  responseId: string,
  questionId: string,
  reaction: ReactionType,
): Promise<SocialActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to react to answers." };
  }

  const { data: existing } = await supabase
    .from("response_reactions")
    .select("id, reaction")
    .eq("user_id", user.id)
    .eq("response_id", responseId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("response_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: "Could not remove reaction." };
    }
  } else if (existing) {
    const { error } = await supabase
      .from("response_reactions")
      .update({ reaction })
      .eq("id", existing.id);

    if (error) {
      if (isMissingSchemaError(error.message)) {
        return {
          success: false,
          error: "Run migration 20260307195000_social_engagement_and_scoring.sql in Supabase.",
        };
      }
      return { success: false, error: "Could not update reaction." };
    }
  } else {
    const { error } = await supabase.from("response_reactions").insert({
      user_id: user.id,
      response_id: responseId,
      reaction,
    });

    if (error) {
      if (isMissingSchemaError(error.message)) {
        return {
          success: false,
          error: "Run migration 20260307195000_social_engagement_and_scoring.sql in Supabase.",
        };
      }
      return { success: false, error: "Could not save reaction." };
    }
  }

  revalidatePath(`/question/${questionId}`);
  return { success: true };
}

export async function submitResponseReply(
  responseId: string,
  questionId: string,
  text: string,
): Promise<SocialActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to reply." };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "Reply cannot be empty." };
  }

  if (trimmed.length > 500) {
    return { success: false, error: "Reply must be 500 characters or fewer." };
  }

  const { error } = await supabase.from("response_replies").insert({
    user_id: user.id,
    response_id: responseId,
    text: trimmed,
  });

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        success: false,
        error: "Run migration 20260307195000_social_engagement_and_scoring.sql in Supabase.",
      };
    }
    console.error("Failed to submit reply:", error.message);
    return { success: false, error: "Could not post reply." };
  }

  revalidatePath(`/question/${questionId}`);
  return { success: true };
}
