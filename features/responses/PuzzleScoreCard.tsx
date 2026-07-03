import type { Question } from "@/types";
import type { ResponseWithUser } from "./queries";
import { scorePuzzleAnswer } from "./puzzle-score";

interface PuzzleScoreCardProps {
  question: Question;
  userResponse: ResponseWithUser;
}

export function PuzzleScoreCard({ question, userResponse }: PuzzleScoreCardProps) {
  const result = scorePuzzleAnswer(question, userResponse);

  const styles = {
    correct:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    incorrect:
      "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    unverified:
      "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[result.status]}`}>
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Puzzle score
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {result.message}
      </p>
      {result.status === "incorrect" && result.canonicalHint && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Verified answer: {result.canonicalHint}
        </p>
      )}
    </div>
  );
}
