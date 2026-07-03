import type { ResponseWithUser } from "./queries";
import {
  computeEstimationMedian,
  estimationMedianText,
} from "./estimation-median";

interface EstimationMedianCardProps {
  userResponse: ResponseWithUser;
  allResponses: ResponseWithUser[];
}

export function EstimationMedianCard({
  userResponse,
  allResponses,
}: EstimationMedianCardProps) {
  const result = computeEstimationMedian(userResponse, allResponses);

  if (!result) {
    return null;
  }

  const barMax = Math.max(result.userEstimate, result.crowdMedian, 1);

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-5 dark:border-orange-900 dark:from-orange-950/40 dark:to-zinc-900">
      <h2 className="text-sm font-bold text-orange-900 dark:text-orange-200">
        You vs crowd median
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {estimationMedianText(result)}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Your estimate</span>
            <span>{result.userEstimate.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${(result.userEstimate / barMax) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Crowd median</span>
            <span>{result.crowdMedian.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500 dark:bg-zinc-400"
              style={{ width: `${(result.crowdMedian / barMax) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
