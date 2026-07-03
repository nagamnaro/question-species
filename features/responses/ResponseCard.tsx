"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Question, Species } from "@/types";
import { sendPrivateMessage } from "@/features/messages/actions";
import type { PrivateMessageView } from "@/features/messages/types";
import { answersAgree } from "@/features/responses/comparison";
import { isNumericStructuredQuestion } from "@/features/responses/structured-answer-format";
import type { ResponseWithUser } from "@/features/responses/queries";
import { formatPublicDisplayName } from "@/features/social/user-display";
import type { ReactionType } from "./social-actions";
import {
  setResponseReaction,
  submitResponseReply,
} from "./social-actions";
import type {
  ReactionCounts,
  ResponseReplyView,
  ReasoningSnippet,
} from "./social-queries";
import { FriendReasoningPanel } from "./FriendReasoningPanel";
import { ReplyUpvoteButton } from "./ReplyUpvoteButton";

interface ResponseCardProps {
  question: Question;
  response: ResponseWithUser;
  currentUserId: string;
  userAnswerText: string;
  isFriend: boolean;
  initialReaction: ReactionType | null;
  initialReactionCounts: ReactionCounts;
  initialReplies: ResponseReplyView[];
  initialPrivateMessages: PrivateMessageView[];
  friendReasoning: ReasoningSnippet[];
}

function displayName(response: ResponseWithUser): string {
  return formatPublicDisplayName(response.users);
}

function formatPredictionAnswer(text: string, questionText: string): string {
  if (!isNumericStructuredQuestion("prediction", questionText)) return text;
  const value = parseFloat(text.trim());
  if (Number.isNaN(value)) return text;
  return `${value}%`;
}

export function ResponseCard({
  question,
  response,
  currentUserId,
  userAnswerText,
  isFriend,
  initialReaction,
  initialReactionCounts,
  initialReplies,
  initialPrivateMessages,
  friendReasoning,
}: ResponseCardProps) {
  const isOwn = response.user_id === currentUserId;
  const [reaction, setReaction] = useState<ReactionType | null>(initialReaction);
  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts);
  const [replies, setReplies] = useState(initialReplies);
  const [privateMessages, setPrivateMessages] = useState(initialPrivateMessages);
  const [replyText, setReplyText] = useState("");
  const [privateText, setPrivateText] = useState("");
  const [publicReplyOpen, setPublicReplyOpen] = useState(false);
  /** 'answer' = reply to the response; otherwise id of public reply to nest under */
  const [publicReplyAnchor, setPublicReplyAnchor] = useState<string>("answer");
  const [privateReplyOpen, setPrivateReplyOpen] = useState(false);
  /** null = new private note to the answer author; otherwise reply under that message */
  const [privateReplyToMessageId, setPrivateReplyToMessageId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPublicReplyForm(anchor: string = "answer") {
    setPrivateReplyOpen(false);
    setPrivateReplyToMessageId(null);
    setPublicReplyAnchor(anchor);
    setPublicReplyOpen(true);
  }

  function openPrivateReplyForm(messageId: string | null) {
    setPublicReplyOpen(false);
    setPublicReplyAnchor("answer");
    setPrivateReplyToMessageId(messageId);
    setPrivateReplyOpen(true);
  }

  function closeReplyForms() {
    setPublicReplyOpen(false);
    setPrivateReplyOpen(false);
    setPrivateReplyToMessageId(null);
    setPublicReplyAnchor("answer");
  }

  useEffect(() => {
    if (window.location.hash !== `#response-${response.id}`) return;
    const lastIncoming = privateMessages.find((message) => !message.isSentByMe);
    openPrivateReplyForm(lastIncoming?.id ?? null);
    const element = document.getElementById(`response-${response.id}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [response.id, privateMessages]);

  const alignsWithUser =
    !isOwn &&
    answersAgree(
      userAnswerText,
      response.answer_text,
      question.species,
      question.text,
    );

  const reactionMismatch =
    !isOwn &&
    reaction !== null &&
    ((reaction === "disagree" && alignsWithUser) ||
      (reaction === "agree" && !alignsWithUser));

  function handleReaction(next: ReactionType) {
    setError(null);
    const previous = reaction;
    startTransition(async () => {
      const result = await setResponseReaction(
        response.id,
        question.id,
        next,
      );
      if (!result.success) {
        setError(result.error ?? "Failed");
        return;
      }
      const toggledOff = previous === next;
      setReaction(toggledOff ? null : next);
      setReactionCounts((counts) => {
        const nextCounts = { ...counts };
        if (previous === "agree") nextCounts.agree = Math.max(0, nextCounts.agree - 1);
        if (previous === "disagree") {
          nextCounts.disagree = Math.max(0, nextCounts.disagree - 1);
        }
        if (!toggledOff) {
          if (next === "agree") nextCounts.agree += 1;
          if (next === "disagree") nextCounts.disagree += 1;
        }
        return nextCounts;
      });
    });
  }

  function handleReplySubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitResponseReply(
        response.id,
        question.id,
        replyText,
      );
      if (!result.success) {
        setError(result.error ?? "Failed");
        return;
      }

      setReplies((current) => [
        ...current,
        {
          id: `optimistic-${Date.now()}`,
          text: replyText.trim(),
          userId: currentUserId,
          displayName: "You",
          createdAt: new Date().toISOString(),
          upvotes: 0,
          hasUpvoted: false,
        },
      ]);
      setReplyText("");
      closeReplyForms();
    });
  }

  function handlePrivateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const recipientId = privateReplyRecipientId();

    if (!recipientId) {
      setError("No one to reply to.");
      return;
    }

    startTransition(async () => {
      const result = await sendPrivateMessage(
        response.id,
        question.id,
        recipientId,
        privateText,
      );
      if (!result.success) {
        setError(result.error ?? "Failed");
        return;
      }

      setPrivateMessages((current) => [
        ...current,
        {
          id: `optimistic-${Date.now()}`,
          responseId: response.id,
          questionId: question.id,
          questionText: question.text,
          senderId: currentUserId,
          recipientId,
          senderName: "You",
          recipientName: isOwn
            ? (privateMessages.find((message) => !message.isSentByMe)?.senderName ??
              "Them")
            : displayName(response),
          body: privateText.trim(),
          createdAt: new Date().toISOString(),
          readAt: null,
          isSentByMe: true,
        },
      ]);
      setPrivateText("");
      closeReplyForms();
    });
  }

  function privateReplyRecipientId(): string | null {
    if (privateReplyToMessageId) {
      const target = privateMessages.find(
        (message) => message.id === privateReplyToMessageId,
      );
      if (target) {
        return target.isSentByMe ? target.recipientId : target.senderId;
      }
    }

    if (isOwn) {
      return privateMessages.find((message) => !message.isSentByMe)?.senderId ?? null;
    }

    return response.user_id;
  }

  function privateFormHint(): string {
    if (privateReplyToMessageId) {
      const target = privateMessages.find(
        (message) => message.id === privateReplyToMessageId,
      );
      if (target) {
        return `Replying privately to ${target.isSentByMe ? target.recipientName : target.senderName}. Only you two will see this.`;
      }
    }

    if (isOwn) {
      return "Only you and the other person will see this reply.";
    }

    return `Only you and ${displayName(response)} will see this note.`;
  }

  function publicReplyContextLabel(): string {
    if (publicReplyAnchor === "answer") {
      return `Replying publicly to ${isOwn ? "your answer" : displayName(response)}`;
    }

    const target = replies.find((reply) => reply.id === publicReplyAnchor);
    return target
      ? `Replying publicly to ${target.displayName}`
      : "Add to the discussion";
  }

  const publicReplyForm = publicReplyOpen ? (
    <form onSubmit={handleReplySubmit} className="mt-2 space-y-2">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {publicReplyContextLabel()}
      </p>
      <textarea
        value={replyText}
        onChange={(event) => setReplyText(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Add to the discussion…"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !replyText.trim()}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Post reply
        </button>
        <button
          type="button"
          onClick={closeReplyForms}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  ) : null;

  const privateReplyForm = privateReplyOpen ? (
    <form onSubmit={handlePrivateSubmit} className="mt-2 space-y-2">
      <p className="text-xs text-indigo-700 dark:text-indigo-300">
        {privateFormHint()}
      </p>
      <textarea
        value={privateText}
        onChange={(event) => setPrivateText(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Ask why they think that, or share a private reaction…"
        className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-3 py-2 text-sm dark:border-indigo-900 dark:bg-indigo-950/20"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !privateText.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Send private note
        </button>
        <button
          type="button"
          onClick={closeReplyForms}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
        >
          Cancel
        </button>
      </div>
    </form>
  ) : null;

  return (
    <li
      id={`response-${response.id}`}
      className={`scroll-mt-24 rounded-xl border p-4 ${
        isOwn
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50"
          : isFriend
            ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/profile/${response.user_id}`}
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          {isOwn ? "You" : displayName(response)}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {isFriend && (
            <span className="rounded-full bg-sky-200 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-900 dark:text-sky-200">
              Friend
            </span>
          )}
          {isFriend && !isOwn && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                alignsWithUser
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
              }`}
            >
              {alignsWithUser ? "Aligns with you" : "Differs from you"}
            </span>
          )}
          {isOwn && (
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              Your answer
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {question.species === "prediction"
          ? formatPredictionAnswer(response.answer_text, question.text)
          : response.answer_text}
      </p>

      {response.prediction_value !== null && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Crowd estimate: {Math.round(Number(response.prediction_value))}%
          expected agreement
        </p>
      )}

      {response.reasoning_text && (
        <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          {isFriend && !isOwn && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              Their reasoning
            </p>
          )}
          <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
            {response.reasoning_text}
          </p>
        </div>
      )}

      {isFriend && !isOwn && (
        <FriendReasoningPanel
          userId={response.user_id}
          displayName={displayName(response)}
          snippets={friendReasoning}
        />
      )}

      {!isOwn && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          {(reactionCounts.agree > 0 || reactionCounts.disagree > 0) && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {reactionCounts.agree > 0 && `${reactionCounts.agree} agree`}
              {reactionCounts.agree > 0 && reactionCounts.disagree > 0 && " · "}
              {reactionCounts.disagree > 0 &&
                `${reactionCounts.disagree} disagree`}
            </span>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleReaction("agree")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              reaction === "agree"
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Agree
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleReaction("disagree")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              reaction === "disagree"
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Disagree
          </button>
          <button
            type="button"
            onClick={() =>
              publicReplyOpen && publicReplyAnchor === "answer"
                ? closeReplyForms()
                : openPublicReplyForm("answer")
            }
            className="rounded-full px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Public reply
          </button>
          <button
            type="button"
            onClick={() =>
              privateReplyOpen && privateReplyToMessageId === null
                ? closeReplyForms()
                : openPrivateReplyForm(null)
            }
            className="rounded-full px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
          >
            Private note
          </button>
        </div>
      )}

      {reactionMismatch && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {reaction === "disagree" && alignsWithUser
            ? "You gave a similar answer — this marks social disagreement with their reasoning."
            : "Your answers differ — agree here means you align with how they think about it."}
        </p>
      )}

      {!isOwn &&
        publicReplyOpen &&
        publicReplyAnchor === "answer" &&
        publicReplyForm}

      {isOwn && privateMessages.some((message) => !message.isSentByMe) && (
        <div className="mt-3 border-t border-indigo-100 pt-3 dark:border-indigo-900/50">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Private thread
          </p>
        </div>
      )}

      {privateMessages.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-indigo-100 pt-3 dark:border-indigo-900/50">
          {privateMessages.map((message) => (
            <li key={message.id}>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2 text-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                  {message.isSentByMe
                    ? "You (private)"
                    : `${message.senderName} (private)`}
                </span>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                  {message.body}
                </p>
                {!message.isSentByMe && (
                  <button
                    type="button"
                    onClick={() =>
                      privateReplyOpen &&
                      privateReplyToMessageId === message.id
                        ? closeReplyForms()
                        : openPrivateReplyForm(message.id)
                    }
                    className="mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                  >
                    Reply privately
                  </button>
                )}
              </div>
              {privateReplyOpen && privateReplyToMessageId === message.id
                ? privateReplyForm
                : null}
            </li>
          ))}
        </ul>
      )}

      {!isOwn &&
        privateReplyOpen &&
        privateReplyToMessageId === null &&
        privateReplyForm}

      {replies.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          {replies.map((reply) => (
            <li key={reply.id}>
              <div className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/50">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {reply.displayName}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {" — "}
                    {reply.text}
                  </span>
                  {!isOwn && (
                    <button
                      type="button"
                      onClick={() =>
                        publicReplyOpen && publicReplyAnchor === reply.id
                          ? closeReplyForms()
                          : openPublicReplyForm(reply.id)
                      }
                      className="mt-2 block rounded-full px-2.5 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      Reply
                    </button>
                  )}
                </div>
                {!reply.id.startsWith("optimistic-") && (
                  <ReplyUpvoteButton
                    replyId={reply.id}
                    questionId={question.id}
                    initialUpvotes={reply.upvotes}
                    initialUpvoted={reply.hasUpvoted}
                    isAuthenticated={Boolean(currentUserId)}
                  />
                )}
              </div>
              {publicReplyOpen && publicReplyAnchor === reply.id
                ? publicReplyForm
                : null}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </li>
  );
}
