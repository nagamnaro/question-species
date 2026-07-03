import type { Question } from "@/types";
import type { ResponseWithUser } from "@/features/responses/queries";
import type { ComparisonResult } from "@/features/responses/comparison";
import { EchoChamberPrompt } from "@/features/responses/EchoChamberPrompt";
import { getOpposingClusterTitles } from "@/features/questions/anti-echo";
import { getOrGenerateInsights } from "./generate-insights";
import { InsightSummary } from "./InsightSummary";

interface ResultsInsightsSectionProps {
  question: Question;
  responses: ResponseWithUser[];
  comparison: ComparisonResult;
}

export async function ResultsInsightsSection({
  question,
  responses,
  comparison,
}: ResultsInsightsSectionProps) {
  const insight = await getOrGenerateInsights(question, responses);

  const clusters =
    insight.status === "ready" || insight.status === "cached"
      ? insight.clusters
      : [];
  const opposingClusterTitles = getOpposingClusterTitles(clusters);

  return (
    <>
      <div className="reveal-item">
        <EchoChamberPrompt
          comparison={comparison}
          opposingClusterTitles={opposingClusterTitles}
        />
      </div>
      <div className="reveal-item">
        <InsightSummary insight={insight} />
      </div>
    </>
  );
}
