import Link from "next/link";
import type { EnrichedQuestion } from "./enrich-feed";
import {
  BADGE_STYLES,
  type QuestionFeedSignals,
} from "./feed-signals";
import { SpeciesBadge, SpeciesIcon } from "./SpeciesBadge";
import { SubmittedByLink } from "./SubmittedByLink";
import { UpvoteButton } from "./UpvoteButton";
import { getSpeciesStyle } from "./species-styles";

interface QuestionCardProps {
  question: EnrichedQuestion;
  signals?: QuestionFeedSignals;
  isAuthenticated: boolean;
  hasUpvoted: boolean;
}

export function QuestionCard({
  question,
  signals,
  isAuthenticated,
  hasUpvoted,
}: QuestionCardProps) {
  const style = getSpeciesStyle(question.species);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${style.card} ${style.cardHover}`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${style.accent} opacity-80 transition-all group-hover:w-1.5`}
        aria-hidden="true"
      />

      <div className="flex gap-4 pl-2">
        <SpeciesIcon species={question.species} size="md" />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SpeciesBadge species={question.species} />
            {question.author && <SubmittedByLink author={question.author} />}
            {signals?.badges.map((badge) => (
              <span
                key={badge}
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge].className}`}
              >
                {BADGE_STYLES[badge].label}
              </span>
            ))}
          </div>

          <Link href={`/question/${question.id}`} className="block">
            <p className="text-base font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
              {question.text}
            </p>

            {signals && signals.opposingClusters.length >= 2 && (
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Opposing views:
                </span>{" "}
                {signals.opposingClusters.join(" · ")}
              </p>
            )}
          </Link>

          <div
            className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${style.muted}`}
          >
            <UpvoteButton
              questionId={question.id}
              initialUpvotes={question.upvotes}
              initialUpvoted={hasUpvoted}
              isAuthenticated={isAuthenticated}
              size="sm"
            />
            {signals && signals.responseCount > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>{signals.responseCount} responses</span>
              </>
            )}
            {isAuthenticated &&
              signals !== undefined &&
              signals.friendsAnsweredPercent !== null && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1">
                  <FriendsIcon />
                  {signals.friendsAnsweredCount > 0
                    ? `${signals.friendsAnsweredPercent}% of friends answered`
                    : "No friends answered yet"}
                </span>
              </>
            )}
            <Link
              href={`/question/${question.id}`}
              className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-800/60 dark:text-zinc-300"
            >
              Answer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6.5 8a2.5 2.5 0 113.25 2.364A4.002 4.002 0 0110 14.5a4.002 4.002 0 013.25-4.136A2.5 2.5 0 1113.5 8 4 4 0 0010 12.5 4 4 0 006.5 8z" />
    </svg>
  );
}
