import type { Response } from "@/types";

export interface EstimationMedianResult {
  userEstimate: number;
  crowdMedian: number;
  difference: number;
  comparison: "below" | "above" | "spot_on";
  totalCount: number;
}

function parseNumeric(text: string): number | null {
  const value = parseFloat(text.trim().replace(/,/g, ""));
  return Number.isNaN(value) ? null : value;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function computeEstimationMedian(
  userResponse: Pick<Response, "answer_text">,
  allResponses: Pick<Response, "answer_text">[],
): EstimationMedianResult | null {
  const userEstimate = parseNumeric(userResponse.answer_text);
  if (userEstimate === null) return null;

  const values = allResponses
    .map((response) => parseNumeric(response.answer_text))
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  const crowdMedian = median(values);
  const difference = userEstimate - crowdMedian;
  const tolerance = Math.max(Math.abs(crowdMedian) * 0.05, 1);

  let comparison: EstimationMedianResult["comparison"] = "spot_on";
  if (difference > tolerance) comparison = "above";
  else if (difference < -tolerance) comparison = "below";

  return {
    userEstimate,
    crowdMedian,
    difference,
    comparison,
    totalCount: values.length,
  };
}

export function estimationMedianText(result: EstimationMedianResult): string {
  const { userEstimate, crowdMedian, comparison, totalCount } = result;

  if (comparison === "spot_on") {
    return `Spot on — your estimate (${formatNum(userEstimate)}) matches the crowd median (${formatNum(crowdMedian)}) across ${totalCount} answers.`;
  }

  if (comparison === "above") {
    return `You estimated ${formatNum(userEstimate)}, above the crowd median of ${formatNum(crowdMedian)} (${totalCount} answers).`;
  }

  return `You estimated ${formatNum(userEstimate)}, below the crowd median of ${formatNum(crowdMedian)} (${totalCount} answers).`;
}

function formatNum(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}
