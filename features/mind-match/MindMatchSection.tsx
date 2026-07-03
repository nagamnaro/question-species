import Link from "next/link";
import type { MindMatch, MindMatchWithDiscussion } from "./types";

interface MindMatchListProps {
  matches: MindMatchWithDiscussion[];
  emptyMessage: string;
}

function MatchCard({ match }: { match: MindMatchWithDiscussion }) {
  const isAlign = match.kind === "align";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/profile/${match.userId}`}
            className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
          >
            {match.displayName}
          </Link>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {match.sharedCount} shared questions
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isAlign
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
          }`}
        >
          {match.agreementPercent}% aligned
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        {isAlign
          ? `You agree on ${match.agreeCount} of ${match.sharedCount} shared answers.`
          : `Productive tension — aligned on ${match.agreeCount} of ${match.sharedCount}, diverging on the rest.`}
      </p>

      {match.discussionLink && (
        <Link
          href={`/question/${match.discussionLink.questionId}#response-${match.discussionLink.responseId}`}
          className="mt-4 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Start discussion
        </Link>
      )}
    </div>
  );
}

export function MindMatchList({ matches, emptyMessage }: MindMatchListProps) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.userId} match={match} />
      ))}
    </div>
  );
}

interface MindMatchSectionProps {
  title: string;
  description: string;
  matches: MindMatchWithDiscussion[];
  emptyMessage: string;
}

export function MindMatchSection({
  title,
  description,
  matches,
  emptyMessage,
}: MindMatchSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <MindMatchList matches={matches} emptyMessage={emptyMessage} />
    </section>
  );
}
