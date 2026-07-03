import type { Question } from "@/types";
import type { ResponseWithUser } from "@/features/responses/queries";
import { getOrGenerateInsights } from "./generate-insights";
import { InsightSummary } from "./InsightSummary";

interface InsightSummaryLoaderProps {
  question: Question;
  responses: ResponseWithUser[];
}

export async function InsightSummaryLoader({
  question,
  responses,
}: InsightSummaryLoaderProps) {
  const insight = await getOrGenerateInsights(question, responses);
  return (
    <div className="reveal-item">
      <InsightSummary insight={insight} />
    </div>
  );
}

export function InsightSummarySkeleton() {
  return (
    <div className="reveal-item rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-300 dark:bg-zinc-700" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Mapping reasoning clusters…
      </p>
    </div>
  );
}
