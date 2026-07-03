import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import { formatPublicDisplayName } from "@/features/social/user-display";
import type { PrivateMessageView, PrivateMessagesByResponse } from "./types";

type MessageRow = {
  id: string;
  response_id: string;
  question_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  questions: { text: string } | null;
  sender: { display_name: string | null; avatar_url: string | null } | null;
  recipient: { display_name: string | null; avatar_url: string | null } | null;
};

function mapRow(row: MessageRow, currentUserId: string): PrivateMessageView {
  return {
    id: row.id,
    responseId: row.response_id,
    questionId: row.question_id,
    questionText: row.questions?.text ?? "Question",
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    senderName: formatPublicDisplayName(row.sender),
    recipientName: formatPublicDisplayName(row.recipient),
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
    isSentByMe: row.sender_id === currentUserId,
  };
}

const MESSAGE_SELECT = `
  id, response_id, question_id, sender_id, recipient_id, body, created_at, read_at,
  questions(text),
  sender:users!response_private_messages_sender_id_fkey(display_name, avatar_url),
  recipient:users!response_private_messages_recipient_id_fkey(display_name, avatar_url)
`;

export async function getPrivateMessagesForResponses(
  responseIds: string[],
  currentUserId: string,
): Promise<PrivateMessagesByResponse> {
  if (responseIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("response_private_messages")
    .select(MESSAGE_SELECT)
    .in("response_id", responseIds)
    .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
    .order("created_at", { ascending: true });

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch private messages:", error.message);
    }
    return {};
  }

  const grouped: PrivateMessagesByResponse = {};
  for (const row of (data ?? []) as unknown as MessageRow[]) {
    const view = mapRow(row, currentUserId);
    const list = grouped[view.responseId] ?? [];
    list.push(view);
    grouped[view.responseId] = list;
  }

  return grouped;
}

export async function getInboxMessages(
  userId: string,
  limit = 50,
): Promise<PrivateMessageView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("response_private_messages")
    .select(MESSAGE_SELECT)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to fetch inbox:", error.message);
    }
    return [];
  }

  return ((data ?? []) as unknown as MessageRow[]).map((row) =>
    mapRow(row, userId),
  );
}

export async function getUnreadPrivateMessageCount(
  userId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("response_private_messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to count unread messages:", error.message);
    }
    return 0;
  }

  return count ?? 0;
}

export async function getSharedQuestionLink(
  userA: string,
  userB: string,
): Promise<{ questionId: string; responseId: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_shared_question_link", {
    p_user_a: userA,
    p_user_b: userB,
  });

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.error("Failed to get shared question link:", error.message);
    }
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    questionId: row.question_id,
    responseId: row.response_id,
  };
}
