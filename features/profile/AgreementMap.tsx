import Link from "next/link";
import type { PairAgreement } from "@/features/mind-match/types";

interface AgreementMapProps {
  entries: PairAgreement[];
  answeredCount: number;
  highlightUserId?: string | null;
  title?: string;
  emptyMessage?: string;
}

function agreementBarColor(percent: number): string {
  if (percent >= 65) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-violet-500";
}

function agreementLabel(percent: number): string {
  if (percent >= 65) return "Often aligns";
  if (percent >= 40) return "Mixed overlap";
  return "Often diverges";
}

export function AgreementMap({
  entries,
  answeredCount,
  highlightUserId,
  title = "Agreement map",
  emptyMessage,
}: AgreementMapProps) {
  const defaultEmpty =
    answeredCount < 3
      ? "Answer at least 3 questions to build your agreement map."
      : "No strong overlaps yet — keep answering and check back.";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Based on shared questions (minimum 3). Higher bars mean more similar
        answers.
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage ?? defaultEmpty}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {entries.map((entry) => {
            const isHighlight = highlightUserId === entry.userId;

            return (
              <li
                key={entry.userId}
                className={
                  isHighlight
                    ? "rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/30"
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={`/profile/${entry.userId}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {entry.displayName}
                  </Link>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {entry.agreementPercent}% · {entry.sharedCount} shared
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${agreementBarColor(entry.agreementPercent)}`}
                    style={{ width: `${entry.agreementPercent}%` }}
                  />
                </div>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {agreementLabel(entry.agreementPercent)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface ViewerAgreementProps {
  displayName: string;
  agreementPercent: number;
  sharedCount: number;
  agreeCount: number;
  discussionLink?: { questionId: string; responseId: string } | null;
}

export function ViewerAgreementCard({
  displayName,
  agreementPercent,
  sharedCount,
  agreeCount,
  discussionLink,
}: ViewerAgreementProps) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-900 dark:from-indigo-950/40 dark:to-zinc-900">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Your mind match with {displayName}
      </h2>
      <p className="mt-2 text-3xl font-semibold text-indigo-700 dark:text-indigo-300">
        {agreementPercent}% aligned
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        You agreed on {agreeCount} of {sharedCount} questions you both answered.
      </p>
      {agreementPercent >= 65 ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
          You often think alike on shared questions.
        </p>
      ) : agreementPercent <= 45 ? (
        <p className="mt-3 text-sm text-violet-700 dark:text-violet-400">
          You disagree in interesting ways — a strong thought partner.
        </p>
      ) : (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          A mix of alignment and contrast on shared topics.
        </p>
      )}
      {discussionLink && (
        <Link
          href={`/question/${discussionLink.questionId}#response-${discussionLink.responseId}`}
          className="mt-4 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Start discussion
        </Link>
      )}
    </div>
  );
}
