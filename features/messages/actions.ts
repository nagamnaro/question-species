"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export interface MessageActionResult {
  success: boolean;
  error?: string;
}

export async function sendPrivateMessage(
  responseId: string,
  questionId: string,
  recipientId: string,
  body: string,
): Promise<MessageActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to send private notes." };
  }

  if (user.id === recipientId) {
    return { success: false, error: "You cannot message yourself." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { success: false, error: "Message cannot be empty." };
  }

  if (trimmed.length > 500) {
    return { success: false, error: "Message must be 500 characters or fewer." };
  }

  const { error } = await supabase.from("response_private_messages").insert({
    response_id: responseId,
    question_id: questionId,
    sender_id: user.id,
    recipient_id: recipientId,
    body: trimmed,
  });

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        success: false,
        error:
          "Run migration 20260307196000_private_response_messages.sql in Supabase.",
      };
    }
    console.error("Failed to send private message:", error.message);
    return { success: false, error: "Could not send private note." };
  }

  revalidatePath(`/question/${questionId}`);
  revalidatePath("/messages");
  return { success: true };
}

export async function markPrivateMessageRead(
  messageId: string,
): Promise<MessageActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in required." };
  }

  const { error } = await supabase
    .from("response_private_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (isMissingSchemaError(error.message)) return { success: false };
    return { success: false, error: "Could not mark as read." };
  }

  revalidatePath("/messages");
  return { success: true };
}
