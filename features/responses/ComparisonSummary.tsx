import type { Question } from "@/types";
import type { ResponseWithUser } from "./queries";
import {
  computeComparison,
  friendsComparisonText,
  globalComparisonText,
} from "./comparison";

interface ComparisonSummaryProps {
  question: Question;
  userResponse: ResponseWithUser;
  responses: ResponseWithUser[];
  followingIds: string[];
}

export function ComparisonSummary({
  question,
  userResponse,
  responses,
  followingIds,
}: ComparisonSummaryProps) {
  const comparison = computeComparison(
    question,
    userResponse,
    responses,
    followingIds,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        How you compare to others
      </h2>

      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <li>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Global:{" "}
          </span>
          {globalComparisonText(comparison)}
        </li>
        <li>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Friends:{" "}
          </span>
          {friendsComparisonText(comparison)}
        </li>
      </ul>
    </div>
  );
}
