export interface SubmissionQualityResult {
  score: number;
  status: "published" | "pending";
  reasons: string[];
}

const BANNED_PATTERNS = [
  /\b(test|asdf|lorem ipsum)\b/i,
  /(.)\1{6,}/,
];

export function scoreSubmissionQuality(text: string): SubmissionQualityResult {
  const trimmed = text.trim();
  const reasons: string[] = [];
  let score = 100;

  if (trimmed.length < 20) {
    score -= 25;
    reasons.push("Question is quite short.");
  }

  if (!trimmed.includes("?") && !trimmed.match(/\b(how|what|why|when|who|which)\b/i)) {
    score -= 15;
    reasons.push("Reads more like a statement than a question.");
  }

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      score -= 40;
      reasons.push("Contains low-quality placeholder text.");
      break;
    }
  }

  const words = trimmed.toLowerCase().split(/\s+/);
  const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
  if (uniqueRatio < 0.5 && words.length > 6) {
    score -= 20;
    reasons.push("Too much repetition.");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: score >= 60 ? "published" : "pending",
    reasons,
  };
}
