"use server";

import {
  suggestQuestionMetadata,
  type QuestionSuggestion,
} from "./submission-intelligence";

export async function getQuestionSuggestions(
  text: string,
): Promise<QuestionSuggestion | null> {
  return suggestQuestionMetadata(text);
}
