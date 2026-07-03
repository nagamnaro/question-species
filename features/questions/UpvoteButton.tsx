"use client";

import { useState, useTransition } from "react";
import { toggleQuestionUpvote } from "./upvote-actions";

interface UpvoteButtonProps {
  questionId: string;
  initialUpvotes: number;
  initialUpvoted: boolean;
  isAuthenticated: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function UpvoteButton({
  questionId,
  initialUpvotes,
  initialUpvoted,
  isAuthenticated,
  size = "md",
  className = "",
}: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) return;

    setError(null);
    startTransition(async () => {
      const result = await toggleQuestionUpvote(questionId);
      if (!result.success) {
        setError(result.error ?? "Failed");
        return;
      }
      setUpvoted(result.upvoted ?? false);
      setUpvotes(result.upvotes ?? upvotes);
    });
  }

  return (
    <span className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!isAuthenticated || isPending}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove upvote" : "Upvote question"}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
          upvoted
            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            : "text-current hover:bg-black/5 dark:hover:bg-white/10"
        } ${!isAuthenticated ? "cursor-default opacity-70" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={iconSize}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
            clipRule="evenodd"
          />
        </svg>
        <span className={size === "sm" ? "text-xs font-medium" : "text-sm font-medium"}>
          {upvotes.toLocaleString()}
        </span>
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </span>
  );
}
