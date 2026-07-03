import type { Question } from "@/types";
import type { ResponseWithUser } from "./queries";
import { isNumericStructuredQuestion } from "./structured-answer-format";

function usesNumericDistribution(question: Question): boolean {
  if (question.species === "estimation") return true;
  if (question.species === "prediction") {
    return isNumericStructuredQuestion(question.species, question.text);
  }
  return false;
}

function buildNumericBuckets(values: number[]): { label: string; count: number }[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bucketCount = Math.min(5, values.length);
  const bucketSize = range / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const low = min + i * bucketSize;
    const high = i === bucketCount - 1 ? max : min + (i + 1) * bucketSize;
    const label =
      bucketSize < 1
        ? `${low.toFixed(1)}–${high.toFixed(1)}`
        : `${Math.round(low)}–${Math.round(high)}`;
    return { label, count: 0, low, high };
  });

  for (const value of values) {
    const bucket =
      buckets.find((b, i) =>
        i === buckets.length - 1
          ? value >= b.low && value <= b.high
          : value >= b.low && value < b.low + bucketSize,
      ) ?? buckets[buckets.length - 1];
    bucket.count++;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function buildTextSummary(
  responses: ResponseWithUser[],
): { answer: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const response of responses) {
    const key = response.answer_text.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

interface DistributionChartProps {
  question: Question;
  responses: ResponseWithUser[];
}

export function DistributionChart({
  question,
  responses,
}: DistributionChartProps) {
  if (responses.length === 0) {
    return null;
  }

  if (usesNumericDistribution(question)) {
    const values = responses
      .map((response) => parseFloat(response.answer_text))
      .filter((value) => !Number.isNaN(value));

    const buckets = buildNumericBuckets(values);
    const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Answer distribution
        </h2>

        {values.length > 0 ? (
          <div className="mt-4 space-y-2">
            {buckets.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
                  {bucket.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded bg-emerald-500/70 transition-all dark:bg-emerald-400/60"
                    style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {bucket.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {responses.length} response{responses.length !== 1 ? "s" : ""}{" "}
            recorded
          </p>
        )}
      </div>
    );
  }

  const summary = buildTextSummary(responses);
  const topCount = summary[0]?.count ?? 1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Answer distribution
      </h2>

      <div className="mt-4 space-y-2">
        {summary.map((item) => (
          <div key={item.answer} className="flex items-start gap-3">
            <div className="mt-1.5 h-2 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded bg-sky-500/70 dark:bg-sky-400/60"
                style={{ width: `${(item.count / topCount) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {item.count}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {summary.map((item) => (
          <li
            key={item.answer}
            className="truncate text-xs text-zinc-600 dark:text-zinc-400"
          >
            {item.answer}
          </li>
        ))}
      </ul>
    </div>
  );
}
