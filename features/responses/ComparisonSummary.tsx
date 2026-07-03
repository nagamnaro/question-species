import type { Question } from "@/types";
import type { ResponseWithUser } from "./queries";
import {
  computeComparison,
  friendsComparisonText,
  globalComparisonText,
  type ComparisonResult,
} from "./comparison";

interface ComparisonSummaryProps {
  question: Question;
  userResponse: ResponseWithUser;
  responses: ResponseWithUser[];
  followingIds: string[];
  comparison?: ComparisonResult;
}

const STANCE_STYLES = {
  majority: {
    border: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    title: "text-emerald-800 dark:text-emerald-300",
    body: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500/70 dark:bg-emerald-400/60",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    label: "Majority",
  },
  minority: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    title: "text-amber-800 dark:text-amber-300",
    body: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500/70 dark:bg-amber-400/60",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    label: "Minority",
  },
  polarised: {
    border: "border-violet-200 dark:border-violet-900",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    title: "text-violet-800 dark:text-violet-300",
    body: "text-violet-700 dark:text-violet-400",
    bar: "bg-violet-500/70 dark:bg-violet-400/60",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
    label: "Polarised minority",
  },
  split: {
    border: "border-sky-200 dark:border-sky-900",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    title: "text-sky-800 dark:text-sky-300",
    body: "text-sky-700 dark:text-sky-400",
    bar: "bg-sky-500/70 dark:bg-sky-400/60",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    label: "Split views",
  },
} as const;

export function ComparisonSummary({
  question,
  userResponse,
  responses,
  followingIds,
  comparison: comparisonProp,
}: ComparisonSummaryProps) {
  const comparison =
    comparisonProp ??
    computeComparison(question, userResponse, responses, followingIds);

  const styles = STANCE_STYLES[comparison.global.stance];
  const globalPercent = comparison.global.agreementPercent;
  const friendsPercent = comparison.friends.agreementPercent;

  return (
    <div className={`rounded-xl border p-5 ${styles.border} ${styles.bg}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={`text-sm font-semibold ${styles.title}`}>
          How you compare to others
        </h2>
        {comparison.global.totalOthers > 0 && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
          >
            {styles.label}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium opacity-70">Global alignment</p>
          <p className="text-2xl font-semibold">{globalPercent}%</p>
          <p className="text-xs opacity-70">
            {comparison.global.alignedCount} of {comparison.global.totalOthers}{" "}
            others
          </p>
        </div>
        <div>
          <p className="text-xs font-medium opacity-70">Friends alignment</p>
          <p className="text-2xl font-semibold">
            {comparison.friends.hasFriendResponses ? `${friendsPercent}%` : "—"}
          </p>
          <p className="text-xs opacity-70">
            {comparison.friends.hasFriendResponses
              ? `${comparison.friends.alignedCount} of ${comparison.friends.totalFriendsAnswered} friends`
              : "No friends answered yet"}
          </p>
        </div>
      </div>

      {comparison.global.totalOthers > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0">Global</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-white/50 dark:bg-black/20">
              <div
                className={`h-full rounded ${styles.bar}`}
                style={{ width: `${Math.min(globalPercent, 100)}%` }}
              />
            </div>
            <span className="w-8 text-right">{globalPercent}%</span>
          </div>
          {comparison.friends.hasFriendResponses && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0">Friends</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-white/50 dark:bg-black/20">
                <div
                  className="h-full rounded bg-zinc-500/60 dark:bg-zinc-400/50"
                  style={{ width: `${Math.min(friendsPercent, 100)}%` }}
                />
              </div>
              <span className="w-8 text-right">{friendsPercent}%</span>
            </div>
          )}
        </div>
      )}

      <div className={`mt-4 space-y-2 text-sm leading-relaxed ${styles.body}`}>
        <p className="font-medium">{globalComparisonText(comparison)}</p>
        <p>{friendsComparisonText(comparison)}</p>
      </div>
    </div>
  );
}
