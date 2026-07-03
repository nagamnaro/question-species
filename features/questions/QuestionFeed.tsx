import type { EnrichedQuestion } from "./enrich-feed";
import type { FeedSignalsMap } from "./feed-signals";
import { QuestionFeedList } from "./QuestionFeedList";
import { SpeciesTabs, type SpeciesFilter } from "./SpeciesTabs";
import { SpeciesIcon } from "./SpeciesBadge";
import { FEED_HERO_STYLE, getSpeciesStyle } from "./species-styles";

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
  const speciesStyle =
    activeFilter !== "all" ? getSpeciesStyle(activeFilter) : null;
  const hero = FEED_HERO_STYLE;

  return (
    <div className="space-y-6">
      <div className="relative w-full overflow-hidden rounded-2xl">
        <div
          className={`absolute left-0 top-0 z-10 h-full w-2 opacity-95 ${
            speciesStyle?.accent ?? hero.accent
          }`}
          aria-hidden="true"
        />

        <div
          className={`rounded-2xl border p-5 pl-8 shadow-md ${
            speciesStyle?.card ?? hero.card
          }`}
        >
          <div className="flex gap-4">
            {activeFilter !== "all" ? (
              <SpeciesIcon species={activeFilter} size="md" />
            ) : (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ring-2 ${hero.icon} ${hero.ring}`}
                aria-hidden="true"
              >
                {hero.emoji}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`text-base font-semibold leading-snug ${
                  speciesStyle?.muted ?? hero.muted
                }`}
              >
                Pick a question, weigh in, and see where you stand
              </p>
              {speciesStyle && (
                <p className={`mt-2 text-sm font-medium ${speciesStyle.muted}`}>
                  {speciesStyle.emoji} Browsing {speciesStyle.label} questions
                </p>
              )}
            </div>
          </div>
        </div>
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
