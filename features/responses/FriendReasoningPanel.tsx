import Link from "next/link";
import type { ReasoningSnippet } from "./social-queries";

interface FriendReasoningPanelProps {
  userId: string;
  displayName: string;
  snippets: ReasoningSnippet[];
}

export function FriendReasoningPanel({
  userId,
  displayName,
  snippets,
}: FriendReasoningPanelProps) {
  if (snippets.length === 0) return null;

  return (
    <details className="mt-2 rounded-lg border border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-sky-800 dark:text-sky-300">
        How {displayName} thinks — recent reasoning
      </summary>
      <ul className="space-y-2 border-t border-sky-200 px-3 py-2 dark:border-sky-900">
        {snippets.map((snippet) => (
          <li key={`${snippet.createdAt}-${snippet.questionText}`}>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {snippet.questionText}
            </p>
            <p className="mt-0.5 text-xs italic text-zinc-600 dark:text-zinc-400">
              {snippet.reasoning}
            </p>
          </li>
        ))}
      </ul>
      <Link
        href={`/profile/${userId}`}
        className="block px-3 pb-2 text-xs font-medium text-sky-700 hover:underline dark:text-sky-300"
      >
        View {displayName}&apos;s profile →
      </Link>
    </details>
  );
}
