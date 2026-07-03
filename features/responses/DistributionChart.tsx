import type { Question } from "@/types";
import type { ResponseWithUser } from "./queries";
import { isNumericStructuredQuestion } from "./structured-answer-format";

export interface DistributionSlice {
  label: string;
  count: number;
  percent: number;
}

const SLICE_PALETTE = [
  { fill: "#8b5cf6", legend: "bg-violet-500" },
  { fill: "#0ea5e9", legend: "bg-sky-500" },
  { fill: "#10b981", legend: "bg-emerald-500" },
  { fill: "#f59e0b", legend: "bg-amber-500" },
  { fill: "#f43f5e", legend: "bg-rose-500" },
  { fill: "#6366f1", legend: "bg-indigo-500" },
  { fill: "#a1a1aa", legend: "bg-zinc-400" },
] as const;

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

function toPercentSlices(
  items: { label: string; count: number }[],
  total: number,
): DistributionSlice[] {
  if (total === 0) return [];

  return items
    .filter((item) => item.count > 0)
    .map((item) => ({
      label: item.label,
      count: item.count,
      percent: Math.round((item.count / total) * 100),
    }));
}

function buildTextSlices(responses: ResponseWithUser[]): DistributionSlice[] {
  const counts = new Map<string, number>();

  for (const response of responses) {
    const key = response.answer_text.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = responses.length;
  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const maxSlices = 6;
  const top = sorted.slice(0, maxSlices - 1);
  const restCount = sorted
    .slice(maxSlices - 1)
    .reduce((sum, item) => sum + item.count, 0);

  const items =
    restCount > 0
      ? [...top, { label: "Other answers", count: restCount }]
      : top;

  return toPercentSlices(items, total);
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= Math.PI * 2 - 0.001) {
    return [
      `M ${cx} ${cy}`,
      `m 0 -${radius}`,
      `a ${radius} ${radius} 0 1 1 0 ${radius * 2}`,
      `a ${radius} ${radius} 0 1 1 0 -${radius * 2}`,
      "Z",
    ].join(" ");
  }

  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function PieChart({ slices }: { slices: DistributionSlice[] }) {
  const size = 168;
  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  let angle = -Math.PI / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label="Answer distribution pie chart"
    >
      {slices.map((slice, index) => {
        const sliceAngle = (slice.count / total) * Math.PI * 2;
        const startAngle = angle;
        const endAngle = angle + sliceAngle;
        angle = endAngle;

        return (
          <path
            key={`${slice.label}-${index}`}
            d={describeSlice(cx, cy, radius, startAngle, endAngle)}
            fill={SLICE_PALETTE[index % SLICE_PALETTE.length]!.fill}
            stroke="var(--background, #fff)"
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
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

  let slices: DistributionSlice[] = [];

  if (usesNumericDistribution(question)) {
    const values = responses
      .map((response) => parseFloat(response.answer_text))
      .filter((value) => !Number.isNaN(value));
    slices = toPercentSlices(buildNumericBuckets(values), values.length);
  } else {
    slices = buildTextSlices(responses);
  }

  if (slices.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/40">
      <h2 className="text-sm font-semibold text-sky-800 dark:text-sky-300">
        Answer distribution
      </h2>
      <p className="mt-0.5 text-xs text-sky-700/80 dark:text-sky-400/80">
        Share of each answer among {responses.length} response
        {responses.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <PieChart slices={slices} />

        <ul className="min-w-0 flex-1 space-y-2.5">
          {slices.map((slice, index) => (
            <li key={`${slice.label}-${index}`} className="flex items-start gap-2.5">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${SLICE_PALETTE[index % SLICE_PALETTE.length]!.legend}`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {slice.label}
                  </p>
                  <span className="shrink-0 text-sm font-semibold text-sky-800 dark:text-sky-300">
                    {slice.percent}%
                  </span>
                </div>
                <p className="text-xs text-sky-700/70 dark:text-sky-400/70">
                  {slice.count} response{slice.count !== 1 ? "s" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
