import type { Question, Species } from "@/types";
import {
  getPredictionChoices,
  getPredictionFormat,
  isNumericPredictionQuestion,
} from "./prediction-format";

export type AnswerInputMode = "text" | "number" | "choice";

type AnswerContext = Pick<Question, "species" | "text">;

export function getAnswerInputMode(question: AnswerContext): AnswerInputMode {
  if (question.species === "estimation") return "number";
  if (question.species === "prediction") {
    return isNumericPredictionQuestion(question.text) ? "number" : "choice";
  }
  return "text";
}

export function getAnswerChoices(question: AnswerContext): string[] {
  if (question.species !== "prediction") return [];
  return [...getPredictionChoices(getPredictionFormat(question.text))];
}

export function getAnswerPlaceholder(question: AnswerContext): string {
  switch (question.species) {
    case "puzzle":
      return "Your answer…";
    case "opinion":
      return "Share your view…";
    case "prediction":
      return isNumericPredictionQuestion(question.text)
        ? "Enter a number (e.g. 42 for 42%)"
        : "";
    case "estimation":
      return "Your estimate…";
    case "brainstorm":
      return "Your idea…";
  }
}

export function getAnswerLabel(question: AnswerContext): string {
  switch (question.species) {
    case "puzzle":
      return "Your answer";
    case "opinion":
      return "Your opinion";
    case "prediction": {
      const format = getPredictionFormat(question.text);
      if (format === "percentage") return "Your prediction (%)";
      if (format === "improve_decline") return "Your prediction";
      return "Yes or no?";
    }
    case "estimation":
      return "Your estimate";
    case "brainstorm":
      return "Your idea";
  }
}

export { isNumericPredictionQuestion };
