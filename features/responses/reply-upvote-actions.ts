"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export interface ToggleReplyUpvoteResult {
  success: boolean;
  upvoted?: boolean;
  upvotes?: number;
  error?: string;
}

export async function toggleResponseReplyUpvote(
  replyId: string,
  questionId: string,
): Promise<ToggleReplyUpvoteResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to upvote replies." };
  }

  const { data, error } = await supabase.rpc("toggle_response_reply_upvote", {
    p_reply_id: replyId,
  });

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        success: false,
        error:
          "Reply upvotes need migration 20260307204000_response_reply_upvotes.sql. Run it in Supabase SQL Editor.",
      };
    }
    console.error("Failed to toggle reply upvote:", error.message);
    return { success: false, error: "Could not update upvote." };
  }

  const row = data?.[0];
  revalidatePath(`/question/${questionId}`);

  return {
    success: true,
    upvoted: row?.upvoted ?? false,
    upvotes: row?.upvotes ?? 0,
  };
}
