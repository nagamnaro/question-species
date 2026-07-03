import type { Response, Species } from "@/types";
import { answersAgree } from "./comparison";
import { isNumericStructuredQuestion } from "./structured-answer-format";

/** Within this many percentage points counts as "agreeing" with a prediction answer. */
const AGREEMENT_TOLERANCE = 10;

/** Within this many points of actual = "accurate" crowd estimate. */
const ACCURACY_TOLERANCE = 10;

export type CrowdEstimateAccuracy = "accurate" | "overestimated" | "underestimated";

export interface PredictionAccuracyResult {
  userPrediction: number;
  actualAgreementPercent: number;
  accuracy: CrowdEstimateAccuracy;
  agreeingCount: number;
  totalCount: number;
}

function parseNumericAnswer(text: string): number | null {
  const value = parseFloat(text.trim());
  return Number.isNaN(value) ? null : value;
}

/**
 * Actual % of respondents whose prediction is close to the user's answer.
 * MVP plan: compare crowd estimate vs how many actually align.
 */
export function computeActualAgreementPercent(
  userAnswerText: string,
  responses: Pick<Response, "answer_text">[],
): { percent: number; agreeingCount: number; totalCount: number } {
  const userValue = parseNumericAnswer(userAnswerText);
  const values = responses
    .map((r) => parseNumericAnswer(r.answer_text))
    .filter((v): v is number => v !== null);

  const totalCount = values.length;
  if (totalCount === 0 || userValue === null) {
    return { percent: 0, agreeingCount: 0, totalCount };
  }

  const agreeingCount = values.filter(
    (v) => Math.abs(v - userValue) <= AGREEMENT_TOLERANCE,
  ).length;

  return {
    percent: (agreeingCount / totalCount) * 100,
    agreeingCount,
    totalCount,
  };
}

export function getCrowdEstimateAccuracy(
  predictedPercent: number,
  actualPercent: number,
): CrowdEstimateAccuracy {
  const diff = predictedPercent - actualPercent;
  if (Math.abs(diff) <= ACCURACY_TOLERANCE) return "accurate";
  return diff > 0 ? "overestimated" : "underestimated";
}

export function computePredictionAccuracy(
  userResponse: Pick<Response, "answer_text" | "prediction_value" | "user_id">,
  allResponses: Pick<Response, "answer_text" | "user_id">[],
  species: Species = "prediction",
  questionText?: string,
): PredictionAccuracyResult | null {
  if (userResponse.prediction_value === null) return null;

  const userPrediction = Number(userResponse.prediction_value);
  if (Number.isNaN(userPrediction)) return null;

  const others = allResponses.filter(
    (response) => response.user_id !== userResponse.user_id,
  );

  let percent: number;
  let agreeingCount: number;
  const totalCount = others.length;

  if (
    species === "estimation" ||
    (species === "prediction" &&
      questionText &&
      isNumericStructuredQuestion(species, questionText))
  ) {
    const numeric = computeActualAgreementPercent(
      userResponse.answer_text,
      others,
    );
    percent = numeric.percent;
    agreeingCount = numeric.agreeingCount;
  } else {
    agreeingCount = others.filter((response) =>
      answersAgree(
        userResponse.answer_text,
        response.answer_text,
        species,
        questionText,
      ),
    ).length;
    percent = totalCount > 0 ? (agreeingCount / totalCount) * 100 : 0;
  }

  return {
    userPrediction,
    actualAgreementPercent: percent,
    accuracy: getCrowdEstimateAccuracy(userPrediction, percent),
    agreeingCount,
    totalCount,
  };
}

export function accuracyMessage(result: PredictionAccuracyResult): string {
  const predicted = Math.round(result.userPrediction);
  const actual = Math.round(result.actualAgreementPercent);

  switch (result.accuracy) {
    case "accurate":
      return `Accurate — you expected ~${predicted}% agreement and ${actual}% of answers aligned with yours.`;
    case "overestimated":
      return `Overestimated — you expected ~${predicted}% agreement, but only ${actual}% aligned with your answer.`;
    case "underestimated":
      return `Underestimated — you expected ~${predicted}% agreement, but ${actual}% aligned with your answer.`;
  }
}

export function accuracyTone(
  accuracy: CrowdEstimateAccuracy,
): "emerald" | "amber" | "sky" {
  switch (accuracy) {
    case "accurate":
      return "emerald";
    case "overestimated":
      return "amber";
    case "underestimated":
      return "sky";
  }
}
