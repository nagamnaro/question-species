import { Suspense } from "react";
import type { Question } from "@/types";
import type { ResponseWithUser } from "@/features/responses/queries";
import {
  InsightSummarySkeleton,
} from "@/features/insights/InsightSummaryLoader";
import { ResultsInsightsSection } from "@/features/insights/ResultsInsightsSection";
import { ComparisonSummary } from "@/features/responses/ComparisonSummary";
import { computeComparison } from "@/features/responses/comparison";
import { DiverseViewsBanner } from "@/features/responses/DiverseViewsBanner";
import { EstimationMedianCard } from "@/features/responses/EstimationMedianCard";
import { NextQuestionButton } from "@/features/responses/NextQuestionButton";
import { PredictionAccuracyCard } from "@/features/responses/PredictionAccuracyCard";
import { PuzzleScoreCard } from "@/features/responses/PuzzleScoreCard";
import { ResponseList } from "@/features/responses/ResponseList";
import { ResultsReveal } from "@/features/responses/ResultsReveal";
import { DistributionChart } from "@/features/responses/DistributionChart";

interface ResultsViewProps {
  question: Question;
  responses: ResponseWithUser[];
  currentUserId: string;
  followingIds: string[];
  nextQuestion: Question | null;
}

export function ResultsView({
  question,
  responses,
  currentUserId,
  followingIds,
  nextQuestion,
}: ResultsViewProps) {
  const userResponse = responses.find((r) => r.user_id === currentUserId);
  const comparison =
    userResponse &&
    computeComparison(question, userResponse, responses, followingIds);

  return (
    <ResultsReveal>
      <div className="reveal-item rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Results unlocked
        </p>
        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
          You answered — here&apos;s how others responded.
        </p>
      </div>

      {userResponse && comparison && (
        <>
          <div className="reveal-item">
            <ComparisonSummary
              question={question}
              userResponse={userResponse}
              responses={responses}
              followingIds={followingIds}
            />
          </div>
          <Suspense fallback={<InsightSummarySkeleton />}>
            <ResultsInsightsSection
              question={question}
              responses={responses}
              comparison={comparison}
            />
          </Suspense>
        </>
      )}

      {userResponse && (
        <div className="reveal-item">
          <DiverseViewsBanner
            question={question}
            userResponse={userResponse}
            responses={responses}
          />
        </div>
      )}

      {question.species === "puzzle" && userResponse && (
        <div className="reveal-item">
          <PuzzleScoreCard question={question} userResponse={userResponse} />
        </div>
      )}

      {question.species === "estimation" && userResponse && (
        <div className="reveal-item">
          <EstimationMedianCard
            userResponse={userResponse}
            allResponses={responses}
          />
        </div>
      )}

      {userResponse && userResponse.prediction_value !== null && (
        <div className="reveal-item">
          <PredictionAccuracyCard
            userResponse={userResponse}
            allResponses={responses}
            species={question.species}
            questionText={question.text}
          />
        </div>
      )}

      <div className="reveal-item">
        <DistributionChart question={question} responses={responses} />
      </div>

      <div className="reveal-item">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          All responses ({responses.length})
        </h2>
        {userResponse ? (
          <ResponseList
            question={question}
            responses={responses}
            currentUserId={currentUserId}
            followingIds={followingIds}
            userAnswerText={userResponse.answer_text}
          />
        ) : null}
      </div>

      <NextQuestionButton nextQuestion={nextQuestion} />
    </ResultsReveal>
  );
}
