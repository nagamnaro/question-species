import type { ReasoningCluster } from "./types";

export function getMinorityCluster(
  clusters: ReasoningCluster[],
): ReasoningCluster | null {
  if (clusters.length < 2) return null;

  const withCounts = clusters.filter(
    (cluster) => cluster.estimated_count !== undefined,
  );

  if (withCounts.length < 2) return null;

  return [...withCounts].sort(
    (a, b) => (a.estimated_count ?? 0) - (b.estimated_count ?? 0),
  )[0]!;
}
