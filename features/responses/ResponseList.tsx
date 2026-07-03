import type { Question } from "@/types";
import { getPrivateMessagesForResponses } from "@/features/messages/queries";
import type { ResponseWithUser } from "./queries";
import { getRecentReasoning, getResponseSocialData } from "./social-queries";
import { ResponseCard } from "./ResponseCard";

interface ResponseListProps {
  question: Question;
  responses: ResponseWithUser[];
  currentUserId: string;
  followingIds: string[];
  userAnswerText: string;
}

export async function ResponseList({
  question,
  responses,
  currentUserId,
  followingIds,
  userAnswerText,
}: ResponseListProps) {
  const followingSet = new Set(followingIds);
  const responseIds = responses.map((response) => response.id);

  const friendUserIds = [
    ...new Set(
      responses
        .filter(
          (response) =>
            response.user_id !== currentUserId &&
            followingSet.has(response.user_id),
        )
        .map((response) => response.user_id),
    ),
  ];

  const [social, privateMessages, ...reasoningLists] = await Promise.all([
    getResponseSocialData(responseIds, currentUserId),
    getPrivateMessagesForResponses(responseIds, currentUserId),
    ...friendUserIds.map((userId) => getRecentReasoning(userId, 3)),
  ]);

  const reasoningByUser = new Map(
    friendUserIds.map((userId, index) => [userId, reasoningLists[index] ?? []]),
  );

  return (
    <ul className="space-y-3">
      {responses.map((response) => (
        <ResponseCard
          key={response.id}
          question={question}
          response={response}
          currentUserId={currentUserId}
          userAnswerText={userAnswerText}
          isFriend={
            response.user_id !== currentUserId &&
            followingSet.has(response.user_id)
          }
          initialReaction={social.reactions[response.id] ?? null}
          initialReactionCounts={
            social.reactionCounts[response.id] ?? { agree: 0, disagree: 0 }
          }
          initialReplies={social.replies[response.id] ?? []}
          initialPrivateMessages={privateMessages[response.id] ?? []}
          friendReasoning={
            followingSet.has(response.user_id)
              ? (reasoningByUser.get(response.user_id) ?? [])
              : []
          }
        />
      ))}
    </ul>
  );
}
