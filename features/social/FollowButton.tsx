"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/features/social/actions";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  isOwnProfile?: boolean;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  isOwnProfile = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) {
    return null;
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId, isFollowing);
      if (result.success && result.isFollowing !== undefined) {
        setIsFollowing(result.isFollowing);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          isFollowing
            ? "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        }`}
      >
        {isPending ? "…" : isFollowing ? "Following" : "Follow"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
