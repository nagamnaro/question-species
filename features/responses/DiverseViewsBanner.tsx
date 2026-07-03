import type { ResponseWithUser } from "./queries";
import { answersAgree } from "./comparison";
import type { Question } from "@/types";

interface DiverseViewsBannerProps {
  question: Question;
  userResponse: ResponseWithUser;
  responses: ResponseWithUser[];
}

export function DiverseViewsBanner({
  question,
  userResponse,
  responses,
}: DiverseViewsBannerProps) {
  const others = responses.filter(
    (response) => response.user_id !== userResponse.user_id,
  );

  if (others.length === 0) return null;

  const divergent = others.filter(
    (response) =>
      !answersAgree(
        userResponse.answer_text,
        response.answer_text,
        question.species,
        question.text,
      ),
  );

  if (divergent.length === 0) return null;

  const sample = divergent.slice(0, 2).map((response) => {
    const text = response.answer_text.trim();
    return text.length > 60 ? `${text.slice(0, 59)}…` : text;
  });

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 px-4 py-3 dark:border-cyan-900 dark:bg-cyan-950/30">
      <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-200">
        People unlike you also said this
      </p>
      <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-300">
        {divergent.length} of {others.length} other answers diverge from yours.
        {sample.length > 0 && (
          <> e.g. &ldquo;{sample.join("&rdquo;, &ldquo;")}&rdquo;</>
        )}
      </p>
    </div>
  );
}
