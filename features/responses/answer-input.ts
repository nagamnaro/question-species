import type { Question } from "@/types";
import {
  getStructuredAnswerFormat,
  getStructuredChoices,
  isNumericStructuredQuestion,
  requiresReasoningForAnswer,
  type StructuredAnswerFormat,
} from "./structured-answer-format";

export type AnswerInputMode = "text" | "number" | "select";

type AnswerContext = Pick<Question, "species" | "text">;

export function getAnswerInputMode(question: AnswerContext): AnswerInputMode {
  if (question.species === "estimation") return "number";

  const format = getStructuredAnswerFormat(question.species, question.text);
  if (format === "percentage") return "number";
  if (format === "yes_no" || format === "improve_decline") return "select";

  return "text";
}

export function getAnswerChoices(question: AnswerContext): string[] {
  const format = getStructuredAnswerFormat(question.species, question.text);
  if (!format || format === "percentage") return [];
  return [...getStructuredChoices(format)];
}

export function isAllowedAnswer(
  question: AnswerContext,
  answer: string,
): boolean {
  if (getAnswerInputMode(question) !== "select") return true;
  return getAnswerChoices(question).includes(answer.trim());
}

export function validateStructuredAnswer(
  question: AnswerContext,
  answerText: string,
  reasoningText?: string,
): string | null {
  const answer = answerText.trim();
  const mode = getAnswerInputMode(question);

  if (mode === "select") {
    if (!isAllowedAnswer(question, answer)) {
      return "Please select an answer from the menu.";
    }
    if (requiresReasoningForAnswer(answer) && !reasoningText?.trim()) {
      return "Please explain your answer in the reasoning field.";
    }
    return null;
  }

  if (mode === "number") {
    if (Number.isNaN(parseFloat(answer))) {
      return "Please enter a valid number.";
    }
    return null;
  }

  if (!answer) {
    return "Please enter an answer.";
  }

  return null;
}

export function getAnswerPlaceholder(question: AnswerContext): string {
  switch (question.species) {
    case "puzzle":
      return "Your answer…";
    case "opinion":
      return "Share your view…";
    case "prediction":
      return isNumericStructuredQuestion(question.species, question.text)
        ? "Enter a number (e.g. 42 for 42%)"
        : "";
    case "estimation":
      return "Your estimate…";
    case "brainstorm":
      return "Your idea…";
  }
}

export function getAnswerLabel(question: AnswerContext): string {
  const format = getStructuredAnswerFormat(question.species, question.text);

  switch (question.species) {
    case "puzzle":
      return "Your answer";
    case "opinion":
      return format === "yes_no" ? "Your view" : "Your opinion";
    case "prediction":
      if (format === "percentage") return "Your prediction (%)";
      return "Your prediction";
    case "estimation":
      return "Your estimate";
    case "brainstorm":
      return "Your idea";
  }
}

export function getSelectPlaceholder(question: AnswerContext): string {
  const format = getStructuredAnswerFormat(question.species, question.text);
  switch (format) {
    case "yes_no":
      return "Select Yes, No, or Other…";
    case "improve_decline":
      return "Select Improve, Decline, or Other…";
    default:
      return "Select an answer…";
  }
}

export {
  getStructuredAnswerFormat,
  isNumericStructuredQuestion,
  requiresReasoningForAnswer,
} from "./structured-answer-format";

/** @deprecated Use isNumericStructuredQuestion */
export function isNumericPredictionQuestion(questionText: string): boolean {
  return isNumericStructuredQuestion("prediction", questionText);
}
