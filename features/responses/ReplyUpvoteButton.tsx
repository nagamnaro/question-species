"use client";

import { useState, useTransition } from "react";
import { toggleResponseReplyUpvote } from "./reply-upvote-actions";

interface ReplyUpvoteButtonProps {
  replyId: string;
  questionId: string;
  initialUpvotes: number;
  initialUpvoted: boolean;
  isAuthenticated: boolean;
}

export function ReplyUpvoteButton({
  replyId,
  questionId,
  initialUpvotes,
  initialUpvoted,
  isAuthenticated,
}: ReplyUpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) return;

    setError(null);
    startTransition(async () => {
      const result = await toggleResponseReplyUpvote(replyId, questionId);
      if (!result.success) {
        setError(result.error ?? "Failed");
        return;
      }
      setUpvoted(result.upvoted ?? false);
      setUpvotes(result.upvotes ?? upvotes);
    });
  }

  return (
    <span className="inline-flex shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isAuthenticated || isPending}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove upvote from reply" : "Upvote reply"}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors ${
          upvoted
            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            : "text-zinc-500 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-700"
        } ${!isAuthenticated ? "cursor-default opacity-70" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-medium">{upvotes.toLocaleString()}</span>
      </button>
      {error && (
        <span className="max-w-[8rem] text-center text-[10px] leading-tight text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}
