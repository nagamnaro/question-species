"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export interface ToggleUpvoteResult {
  success: boolean;
  upvoted?: boolean;
  upvotes?: number;
  error?: string;
}

export async function toggleQuestionUpvote(
  questionId: string,
): Promise<ToggleUpvoteResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to upvote questions." };
  }

  const { data, error } = await supabase.rpc("toggle_question_upvote", {
    p_question_id: questionId,
  });

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        success: false,
        error:
          "Upvotes need the latest database migration (20260307195000_social_engagement_and_scoring.sql). Run it in Supabase SQL Editor.",
      };
    }
    console.error("Failed to toggle upvote:", error.message);
    return { success: false, error: "Could not update upvote." };
  }

  const row = data?.[0];
  revalidatePath("/");
  revalidatePath(`/question/${questionId}`);

  return {
    success: true,
    upvoted: row?.upvoted ?? false,
    upvotes: row?.upvotes ?? 0,
  };
}
