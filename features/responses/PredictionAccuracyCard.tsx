import type { ResponseWithUser } from "@/features/responses/queries";
import type { Species } from "@/types";
import {
  accuracyMessage,
  accuracyTone,
  computePredictionAccuracy,
} from "@/features/responses/prediction-accuracy";

interface PredictionAccuracyCardProps {
  userResponse: ResponseWithUser;
  allResponses: ResponseWithUser[];
  species: Species;
  questionText: string;
}

const TONE_STYLES = {
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    title: "text-emerald-800 dark:text-emerald-300",
    body: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500/70 dark:bg-emerald-400/60",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    title: "text-amber-800 dark:text-amber-300",
    body: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500/70 dark:bg-amber-400/60",
  },
  sky: {
    border: "border-sky-200 dark:border-sky-900",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    title: "text-sky-800 dark:text-sky-300",
    body: "text-sky-700 dark:text-sky-400",
    bar: "bg-sky-500/70 dark:bg-sky-400/60",
  },
} as const;

export function PredictionAccuracyCard({
  userResponse,
  allResponses,
  species,
  questionText,
}: PredictionAccuracyCardProps) {
  const result = computePredictionAccuracy(
    userResponse,
    allResponses,
    species,
    questionText,
  );

  if (!result) return null;

  const tone = accuracyTone(result.accuracy);
  const styles = TONE_STYLES[tone];
  const predicted = Math.round(result.userPrediction);
  const actual = Math.round(result.actualAgreementPercent);

  return (
    <div
      className={`rounded-xl border p-5 ${styles.border} ${styles.bg}`}
    >
      <h2 className={`text-sm font-semibold ${styles.title}`}>
        Crowd estimate vs reality
      </h2>
      <p className="mt-0.5 text-xs opacity-80">
        MVP plan: how well you predicted agreement with your answer
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium opacity-70">You predicted</p>
          <p className="text-2xl font-semibold">{predicted}%</p>
          <p className="text-xs opacity-70">would agree with you</p>
        </div>
        <div>
          <p className="text-xs font-medium opacity-70">Actual alignment</p>
          <p className="text-2xl font-semibold">{actual}%</p>
          <p className="text-xs opacity-70">
            {result.agreeingCount} of {result.totalCount} answers
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0">Your guess</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-white/50 dark:bg-black/20">
            <div
              className={`h-full rounded ${styles.bar}`}
              style={{ width: `${Math.min(predicted, 100)}%` }}
            />
          </div>
          <span className="w-8 text-right">{predicted}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0">Actual</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-white/50 dark:bg-black/20">
            <div
              className="h-full rounded bg-zinc-500/60 dark:bg-zinc-400/50"
              style={{ width: `${Math.min(actual, 100)}%` }}
            />
          </div>
          <span className="w-8 text-right">{actual}%</span>
        </div>
      </div>

      <p className={`mt-4 text-sm font-medium ${styles.body}`}>
        {accuracyMessage(result)}
      </p>
    </div>
  );
}
