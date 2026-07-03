import type { Species } from "@/types";

export type StructuredAnswerFormat =
  | "percentage"
  | "yes_no"
  | "improve_decline";

const PERCENTAGE_PATTERN = /what\s+%|what percentage|how many percent/i;
const IMPROVE_DECLINE_PATTERN = /improve or decline/i;
const WILL_PATTERN = /^will\s+/i;
const OPINION_YES_NO_PATTERN =
  /^(should|would|do you|does|is |are |can |could )\b/i;

/** Infer structured answer type from species + question wording. */
export function getStructuredAnswerFormat(
  species: Species,
  questionText: string,
): StructuredAnswerFormat | null {
  const text = questionText.trim();

  if (species === "estimation") return null;

  if (PERCENTAGE_PATTERN.test(text)) return "percentage";

  if (IMPROVE_DECLINE_PATTERN.test(text)) return "improve_decline";

  if (species === "prediction" && WILL_PATTERN.test(text)) return "yes_no";

  if (species === "opinion" && OPINION_YES_NO_PATTERN.test(text)) {
    return "yes_no";
  }

  if (species === "prediction") return "yes_no";

  return null;
}

export function isNumericStructuredQuestion(
  species: Species,
  questionText: string,
): boolean {
  return getStructuredAnswerFormat(species, questionText) === "percentage";
}

/** @deprecated Use isNumericStructuredQuestion */
export function isNumericPredictionQuestion(questionText: string): boolean {
  return isNumericStructuredQuestion("prediction", questionText);
}

export function getStructuredChoices(
  format: StructuredAnswerFormat,
): readonly string[] {
  switch (format) {
    case "yes_no":
      return ["Yes", "No", "Other"];
    case "improve_decline":
      return ["Improve", "Decline", "Other"];
    default:
      return [];
  }
}

export function requiresReasoningForAnswer(answer: string): boolean {
  return answer.trim() === "Other";
}
