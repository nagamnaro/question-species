export type PredictionFormat = "percentage" | "yes_no" | "improve_decline";

const PERCENTAGE_PATTERN = /what\s+%|what percentage|how many percent/i;
const IMPROVE_DECLINE_PATTERN = /improve or decline/i;
const WILL_PATTERN = /^will\s+/i;

/** Infer how a prediction question should be answered from its wording. */
export function getPredictionFormat(questionText: string): PredictionFormat {
  const text = questionText.trim();

  if (PERCENTAGE_PATTERN.test(text)) return "percentage";
  if (IMPROVE_DECLINE_PATTERN.test(text)) return "improve_decline";
  if (WILL_PATTERN.test(text)) return "yes_no";

  return "yes_no";
}

export function isNumericPredictionQuestion(questionText: string): boolean {
  return getPredictionFormat(questionText) === "percentage";
}

export function getPredictionChoices(
  format: PredictionFormat,
): readonly string[] {
  switch (format) {
    case "yes_no":
      return ["Yes", "No"];
    case "improve_decline":
      return ["Improve", "Decline"];
    default:
      return [];
  }
}
