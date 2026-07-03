import type { InsightResult } from "./types";
import { getMinorityCluster } from "./minority-highlight";

interface InsightSummaryProps {
  insight: InsightResult;
}

export function InsightSummary({ insight }: InsightSummaryProps) {
  if (insight.status === "insufficient_data") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 dark:border-zinc-700 dark:bg-zinc-900/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Insight Summary
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Need at least 2 responses before AI can map reasoning clusters.
        </p>
      </div>
    );
  }

  if (insight.status === "unavailable") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 dark:border-zinc-700 dark:bg-zinc-900/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Insight Summary
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {insight.reason}
        </p>
      </div>
    );
  }

  const clusters =
    insight.status === "ready" || insight.status === "cached"
      ? insight.clusters
      : [];
  const minority = getMinorityCluster(clusters);

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-5 dark:border-violet-900 dark:from-violet-950/40 dark:to-zinc-900">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          ✨
        </span>
        <h2 className="text-sm font-bold text-violet-900 dark:text-violet-200">
          Insight Summary
        </h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {insight.summary_text}
      </p>

      {minority && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Surprising minority view
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {minority.title}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {minority.description}
            {minority.estimated_count !== undefined && (
              <> (~{minority.estimated_count} responses)</>
            )}
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {clusters.map((cluster, index) => (
          <li
            key={`${cluster.title}-${index}`}
            className="rounded-xl border border-violet-100 bg-white/70 px-4 py-3 dark:border-violet-900/60 dark:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {cluster.title}
              </p>
              {cluster.estimated_count !== undefined && (
                <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900 dark:text-violet-200">
                  ~{cluster.estimated_count}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {cluster.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
