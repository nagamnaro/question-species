import type { Question, Species } from "@/types";

type QuestionFlow = Pick<Question, "species" | "tags">;

/** Species/tags that offer a crowd-agreement prediction step after answering. */
export function hasCrowdPredictionStep(question: QuestionFlow): boolean {
  if (question.species === "prediction") return true;
  if (question.species === "opinion") return true;
  if (question.tags.includes("discourse")) return true;
  return false;
}

/** Non-prediction species where step 2 can be skipped. */
export function canSkipCrowdPrediction(question: QuestionFlow): boolean {
  return question.species !== "prediction";
}

export function crowdStepLabel(species: Species): string {
  if (species === "prediction") {
    return "What % of people do you think agree with you?";
  }
  return "What % of people do you think will give a similar answer?";
}
