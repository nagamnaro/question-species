import Link from "next/link";
import type { QuestionAuthor } from "./enrich-feed";

interface SubmittedByLinkProps {
  author: QuestionAuthor;
  size?: "sm" | "md";
}

export function SubmittedByLink({ author, size = "sm" }: SubmittedByLinkProps) {
  const className =
    size === "sm"
      ? "inline-flex rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900"
      : "inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900";

  return (
    <Link href={`/profile/${author.id}`} className={className}>
      Submitted by {author.displayName}
    </Link>
  );
}
