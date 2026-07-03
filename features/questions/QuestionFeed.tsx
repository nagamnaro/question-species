import Link from "next/link";
import type { EnrichedQuestion } from "./enrich-feed";
import type { FeedSignalsMap } from "./feed-signals";
import { QuestionCard } from "./QuestionCard";
import { SpeciesTabs, type SpeciesFilter } from "./SpeciesTabs";
import { getSpeciesStyle } from "./species-styles";

interface QuestionFeedProps {
  questions: EnrichedQuestion[];
  activeFilter: SpeciesFilter;
  feedSignals: FeedSignalsMap;
  isAuthenticated: boolean;
  upvotedQuestionIds: Set<string>;
  showAntiEchoNote?: boolean;
}

export function QuestionFeed({
  questions,
  activeFilter,
  feedSignals,
  isAuthenticated,
  upvotedQuestionIds,
  showAntiEchoNote = false,
}: QuestionFeedProps) {
  const activeStyle =
    activeFilter !== "all" ? getSpeciesStyle(activeFilter) : null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-5 py-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="absolute -right-4 -top-4 text-6xl opacity-20" aria-hidden="true">
          🧠
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Question Feed
        </h1>
        <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          Pick a species. Answer first. Then see how minds compare.
        </p>
        {activeStyle && (
          <p className={`mt-3 text-sm font-semibold ${activeStyle.muted}`}>
            {activeStyle.emoji} Browsing {activeStyle.label} questions
          </p>
        )}
      </div>

      <SpeciesTabs active={activeFilter} />

      {isAuthenticated && (
        <Link
          href="/submit"
          className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm transition-colors hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/40 dark:hover:bg-teal-950/60"
        >
          <span className="font-medium text-teal-900 dark:text-teal-200">
            + Submit a question
          </span>
          <span className="text-teal-700 dark:text-teal-400">Community →</span>
        </Link>
      )}

      {showAntiEchoNote && (
        <p className="rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-xs text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200">
          Anti-echo feed mixes in questions with opposing views and species
          outside your usual patterns.
        </p>
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            No questions yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activeFilter === "all"
              ? "Run the database migrations to seed starter questions."
              : `No ${activeFilter} questions found. Try another species.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              signals={feedSignals[question.id]}
              isAuthenticated={isAuthenticated}
              hasUpvoted={upvotedQuestionIds.has(question.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
