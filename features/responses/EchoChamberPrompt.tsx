import type { ComparisonResult } from "./comparison";

interface EchoChamberPromptProps {
  comparison: ComparisonResult;
  opposingClusterTitles?: string[];
}

export function EchoChamberPrompt({
  comparison,
  opposingClusterTitles = [],
}: EchoChamberPromptProps) {
  const { stance, agreementPercent, totalOthers } = comparison.global;

  if (totalOthers === 0) return null;

  const inBubble = stance === "majority" && agreementPercent >= 60;

  if (!inBubble) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/30">
      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
        You may want to see opposing reasoning
      </p>
      <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
        You align with {agreementPercent}% of others on this question — explore
        replies and minority clusters below to stress-test your view.
      </p>
      {opposingClusterTitles.length >= 2 && (
        <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-400">
          Opposing clusters: {opposingClusterTitles.join(" · ")}
        </p>
      )}
    </div>
  );
}
