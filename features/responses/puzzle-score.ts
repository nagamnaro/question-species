import type { Question, Response } from "@/types";

function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/[$£€]/g, "").replace(/\s+/g, " ");
}

function parseNumeric(text: string): number | null {
  const cleaned = text.trim().replace(/[$£€,%]/g, "").replace(/\s*(cents?|dollars?|usd)\s*/gi, "");
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
}

function numericMatch(userAnswer: string, canonical: string): boolean {
  const userNum = parseNumeric(userAnswer);
  const canonicalNum = parseNumeric(canonical);
  if (userNum === null || canonicalNum === null) return false;

  if (Math.abs(userNum - canonicalNum) <= 0.01) return true;

  // Accept cents vs dollars (e.g. 5 vs 0.05)
  if (canonicalNum < 1 && Math.abs(userNum / 100 - canonicalNum) <= 0.01) {
    return true;
  }
  if (userNum < 1 && Math.abs(userNum - canonicalNum / 100) <= 0.01) {
    return true;
  }

  return false;
}

export type PuzzleScoreResult =
  | { status: "correct"; message: string }
  | { status: "incorrect"; message: string; canonicalHint?: string }
  | { status: "unverified"; message: string };

export function scorePuzzleAnswer(
  question: Pick<Question, "canonical_answer">,
  userResponse: Pick<Response, "answer_text">,
): PuzzleScoreResult {
  const canonical = question.canonical_answer?.trim();
  if (!canonical) {
    return {
      status: "unverified",
      message:
        "This puzzle has no verified answer yet — compare reasoning with others below.",
    };
  }

  const user = userResponse.answer_text.trim();
  const normalizedUser = normalizeAnswer(user);
  const normalizedCanonical = normalizeAnswer(canonical);

  const isCorrect =
    normalizedUser === normalizedCanonical ||
    numericMatch(user, canonical) ||
    normalizedUser.includes(normalizedCanonical) ||
    normalizedCanonical.includes(normalizedUser);

  if (isCorrect) {
    return {
      status: "correct",
      message: "Correct — your answer matches the verified solution.",
    };
  }

  return {
    status: "incorrect",
    message: "Not quite — your answer differs from the verified solution.",
    canonicalHint: canonical,
  };
}
