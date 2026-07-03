import Link from "next/link";
import type { Question } from "@/types";
import { getSpeciesStyle } from "@/features/questions/species-styles";

interface NextQuestionButtonProps {
  nextQuestion: Question | null;
}

export function NextQuestionButton({ nextQuestion }: NextQuestionButtonProps) {
  if (!nextQuestion) {
    return (
      <div className="reveal-item rounded-2xl border border-dashed border-zinc-300 px-5 py-4 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;ve answered all available questions — check the feed for new
          ones.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  const style = getSpeciesStyle(nextQuestion.species);

  return (
    <div className="reveal-item">
      <Link
        href={`/question/${nextQuestion.id}`}
        className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] ${style.cta}`}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{style.emoji}</span>
          Next question
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
