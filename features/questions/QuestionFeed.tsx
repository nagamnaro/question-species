import type { EnrichedQuestion } from "./enrich-feed";
import type { FeedSignalsMap } from "./feed-signals";
import { QuestionFeedList } from "./QuestionFeedList";
import { SpeciesTabs, type SpeciesFilter } from "./SpeciesTabs";
import { getSpeciesStyle } from "./species-styles";

interface QuestionFeedProps {
  questions: EnrichedQuestion[];
  activeFilter: SpeciesFilter;
  feedSignals: FeedSignalsMap;
  isAuthenticated: boolean;
  upvotedQuestionIds: Set<string>;
}

export function QuestionFeed({
  questions,
  activeFilter,
  feedSignals,
  isAuthenticated,
  upvotedQuestionIds,
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

      <QuestionFeedList
        questions={questions}
        activeFilter={activeFilter}
        feedSignals={feedSignals}
        isAuthenticated={isAuthenticated}
        upvotedQuestionIds={upvotedQuestionIds}
      />
    </div>
  );
}
