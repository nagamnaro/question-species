"use server";

import { revalidatePath } from "next/cache";
import { validateStructuredAnswer } from "@/features/responses/answer-input";
import { createClient } from "@/lib/supabase/server";

export interface SubmitResponseInput {
  questionId: string;
  answerText: string;
  reasoningText?: string;
  /** For prediction species: % of people user thinks will agree (0–100). */
  predictionValue?: number;
}

export interface SubmitResponseResult {
  success: boolean;
  error?: string;
}

export async function submitResponse(
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to submit an answer." };
  }

  const answerText = input.answerText.trim();
  if (!answerText) {
    return { success: false, error: "Please enter an answer." };
  }

  let predictionValue: number | null = null;
  if (input.predictionValue !== undefined) {
    if (
      Number.isNaN(input.predictionValue) ||
      input.predictionValue < 0 ||
      input.predictionValue > 100
    ) {
      return {
        success: false,
        error: "Crowd estimate must be between 0 and 100.",
      };
    }
    predictionValue = input.predictionValue;
  }

  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("question_id", input.questionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You have already answered this question." };
  }

  const { error: profileError } = await supabase.rpc(
    "ensure_current_user_profile",
  );

  if (profileError) {
    console.error("Failed to ensure user profile:", profileError.message);
    return {
      success: false,
      error:
        "Your account profile is not set up. Run the latest database migrations in Supabase, then try again.",
    };
  }

  const { data: question } = await supabase
    .from("questions")
    .select("species, text")
    .eq("id", input.questionId)
    .maybeSingle();

  if (question) {
    const validationError = validateStructuredAnswer(
      question,
      answerText,
      input.reasoningText,
    );
    if (validationError) {
      return { success: false, error: validationError };
    }
  }

  if (question?.species === "prediction" && predictionValue === null) {
    return {
      success: false,
      error: "Please provide your crowd agreement estimate (0–100%).",
    };
  }

  const { error } = await supabase.from("responses").insert({
    user_id: user.id,
    question_id: input.questionId,
    answer_text: answerText,
    reasoning_text: input.reasoningText?.trim() || null,
    prediction_value: predictionValue,
  });

  if (error) {
    console.error("Failed to submit response:", error.message, error.code);
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "Your account profile is missing. Run the latest database migrations in Supabase, then try again.",
      };
    }
    return { success: false, error: "Failed to save your response. Please try again." };
  }

  revalidatePath(`/question/${input.questionId}`);
  return { success: true };
}
