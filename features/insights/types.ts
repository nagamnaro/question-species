export interface ReasoningCluster {
  title: string;
  description: string;
  estimated_count?: number;
}

export interface InsightPayload {
  summary_text: string;
  clusters: ReasoningCluster[];
}

export type InsightResult =
  | { status: "ready"; summary_text: string; clusters: ReasoningCluster[] }
  | { status: "cached"; summary_text: string; clusters: ReasoningCluster[] }
  | { status: "insufficient_data" }
  | { status: "unavailable"; reason: string };

export function parseClustersJson(value: unknown): ReasoningCluster[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is ReasoningCluster =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ReasoningCluster).title === "string" &&
        typeof (item as ReasoningCluster).description === "string",
    )
    .slice(0, 6);
}
