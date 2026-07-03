import { createClient } from "@/lib/supabase/server";
import type { QuestionInsight, Json } from "@/types";
import { parseClustersJson, type ReasoningCluster } from "./types";

export interface QuestionInsightView {
  summary_text: string;
  clusters: ReasoningCluster[];
  last_updated: string;
}

export async function getQuestionInsight(
  questionId: string,
): Promise<QuestionInsightView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_insights")
    .select("*")
    .eq("question_id", questionId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch question insight:", error.message);
    return null;
  }

  if (!data) return null;

  return mapInsightRow(data);
}

function mapInsightRow(row: QuestionInsight): QuestionInsightView {
  return {
    summary_text: row.summary_text ?? "",
    clusters: parseClustersJson(row.clusters_json),
    last_updated: row.last_updated,
  };
}

export async function getQuestionInsightsBatch(
  questionIds: string[],
): Promise<Map<string, ReasoningCluster[]>> {
  if (questionIds.length === 0) return new Map();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_insights")
    .select("question_id, clusters_json")
    .in("question_id", questionIds);

  if (error) {
    console.error("Failed to fetch question insights batch:", error.message);
    return new Map();
  }

  const map = new Map<string, ReasoningCluster[]>();
  for (const row of data ?? []) {
    map.set(row.question_id, parseClustersJson(row.clusters_json));
  }

  return map;
}

export async function saveQuestionInsight(
  questionId: string,
  summary_text: string,
  clusters: ReasoningCluster[],
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("upsert_question_insight", {
    p_question_id: questionId,
    p_clusters_json: clusters as unknown as Json,
    p_summary_text: summary_text,
  });

  if (error) {
    console.error("Failed to save question insight:", error.message);
    return false;
  }

  return true;
}
