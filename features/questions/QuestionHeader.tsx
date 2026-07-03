import type { EnrichedQuestion } from "./enrich-feed";
import { SpeciesBadge } from "./SpeciesBadge";
import { SpeciesIcon } from "./SpeciesBadge";
import { SubmittedByLink } from "./SubmittedByLink";
import { UpvoteButton } from "./UpvoteButton";
import { getSpeciesStyle } from "./species-styles";

interface QuestionHeaderProps {
  question: EnrichedQuestion;
  isAuthenticated: boolean;
  hasUpvoted: boolean;
}

export function QuestionHeader({
  question,
  isAuthenticated,
  hasUpvoted,
}: QuestionHeaderProps) {
  const style = getSpeciesStyle(question.species);

  return (
    <header
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${style.header}`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1.5 ${style.accent}`}
        aria-hidden="true"
      />

      <div className="flex gap-4 pl-2">
        <SpeciesIcon species={question.species} size="lg" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SpeciesBadge species={question.species} />
            {question.author && (
              <SubmittedByLink author={question.author} size="md" />
            )}
          </div>

          <h1 className="text-xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {question.text}
          </h1>

          <div
            className={`flex flex-wrap items-center gap-3 text-sm font-medium ${style.muted}`}
          >
            <UpvoteButton
              questionId={question.id}
              initialUpvotes={question.upvotes}
              initialUpvoted={hasUpvoted}
              isAuthenticated={isAuthenticated}
            />
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>Lock in before you peek</span>
          </div>
        </div>
      </div>
    </header>
  );
}
