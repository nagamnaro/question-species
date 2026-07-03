"use server";

import { revalidatePath } from "next/cache";
import { scoreSubmissionQuality } from "@/features/questions/submission-quality";
import { createClient } from "@/lib/supabase/server";
import type { Species } from "@/types";

const SPECIES_VALUES: Species[] = [
  "puzzle",
  "opinion",
  "prediction",
  "estimation",
  "brainstorm",
];

export interface SubmitQuestionInput {
  text: string;
  species: Species;
  tags?: string;
}

export interface SubmitQuestionResult {
  success: boolean;
  error?: string;
  questionId?: string;
  status?: "published" | "pending";
  qualityReasons?: string[];
}

export async function submitQuestion(
  input: SubmitQuestionInput,
): Promise<SubmitQuestionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to submit a question." };
  }

  const text = input.text.trim();
  if (text.length < 10) {
    return {
      success: false,
      error: "Question must be at least 10 characters.",
    };
  }

  if (text.length > 500) {
    return {
      success: false,
      error: "Question must be 500 characters or fewer.",
    };
  }

  if (!SPECIES_VALUES.includes(input.species)) {
    return { success: false, error: "Please choose a valid species." };
  }

  const tags = (input.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

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

  const quality = scoreSubmissionQuality(text);

  let data: { id: string } | null = null;
  let error: { message: string } | null = null;

  const insertWithStatus = await supabase
    .from("questions")
    .insert({
      text,
      species: input.species,
      tags,
      created_by: user.id,
      upvotes: 0,
      status: quality.status,
    })
    .select("id")
    .single();

  data = insertWithStatus.data;
  error = insertWithStatus.error;

  if (error?.message.includes("status") && error.message.includes("column")) {
    const fallback = await supabase
      .from("questions")
      .insert({
        text,
        species: input.species,
        tags,
        created_by: user.id,
        upvotes: 0,
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("Failed to submit question:", error?.message);
    return {
      success: false,
      error: "Could not submit your question. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/submit");

  return {
    success: true,
    questionId: data.id,
    status: quality.status,
    qualityReasons: quality.reasons,
  };
}
