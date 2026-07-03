import type { Species } from "@/types";
import { hostedChatJson } from "@/lib/ai/hosted-llm";
import { isHostedLlmConfigured } from "@/lib/ai/config";

export interface QuestionSuggestion {
  species: Species;
  tags: string[];
  source: "heuristic" | "ai";
}

const SPECIES_LIST: Species[] = [
  "puzzle",
  "opinion",
  "prediction",
  "estimation",
  "brainstorm",
];

const KEYWORDS: Record<Species, string[]> = {
  puzzle: [
    "riddle",
    "solve",
    "how many are left",
    "what comes next",
    "paradox",
    "logic",
    "which weighs",
  ],
  opinion: [
    "should ",
    "ethical",
    "morally",
    "wrong to",
    "fair that",
    "better than",
    "do you think",
    "is it okay",
    "ban ",
  ],
  prediction: [
    "will ",
    "by 20",
    "before 20",
    "what %",
    "what percent",
    "chance that",
    "likely to",
    "in the next",
  ],
  estimation: [
    "how many",
    "how much",
    "estimate",
    "approximately",
    "on average",
    "per day",
    "worldwide",
  ],
  brainstorm: [
    "how would you",
    "how could we",
    "redesign",
    "improve",
    "what would",
    "fix ",
    "alternative to",
  ],
};

const DISCOURSE_TAGS = [
  "ai",
  "tech",
  "politics",
  "culture",
  "social-media",
  "economy",
  "climate",
  "ethics",
  "future",
  "discourse",
  "internet",
  "society",
];

function scoreSpecies(text: string): Species {
  const lower = text.toLowerCase();
  let best: Species = "opinion";
  let bestScore = 0;

  for (const species of SPECIES_LIST) {
    let score = 0;
    for (const keyword of KEYWORDS[species]) {
      if (lower.includes(keyword.trim())) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = species;
    }
  }

  return best;
}

function suggestTags(text: string, species: Species): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>(["discourse"]);

  const tagKeywords: Record<string, string[]> = {
    ai: ["ai", "artificial intelligence", "chatgpt", "llm", "automation"],
    "social-media": [
      "tiktok",
      "twitter",
      "instagram",
      "facebook",
      "social media",
      "algorithm",
    ],
    politics: ["vote", "democracy", "government", "election", "political"],
    climate: ["climate", "carbon", "emissions", "renewable"],
    economy: ["inflation", "housing", "wealth", "inequality", "jobs"],
    culture: ["cancel", "free speech", "culture war", "identity"],
    tech: ["tech", "software", "crypto", "privacy", "data"],
    ethics: ["ethical", "moral", "should", "rights"],
    future: ["2030", "2040", "2050", "future", "next decade"],
    internet: ["online", "internet", "digital", "platform"],
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      tags.add(tag);
    }
  }

  if (species === "puzzle") tags.add("logic");
  if (species === "estimation") tags.add("fermi");
  if (species === "brainstorm") tags.add("ideas");

  return [...tags].slice(0, 5);
}

export function suggestQuestionMetadataHeuristic(
  text: string,
): QuestionSuggestion {
  const trimmed = text.trim();
  const species = scoreSpecies(trimmed);
  return {
    species,
    tags: suggestTags(trimmed, species),
    source: "heuristic",
  };
}

async function suggestWithAi(text: string): Promise<QuestionSuggestion | null> {
  if (!isHostedLlmConfigured()) return null;

  const content = await hostedChatJson([
    {
      role: "system",
      content: `Classify a curiosity question for a social app. Return JSON:
{"species":"puzzle|opinion|prediction|estimation|brainstorm","tags":["up to 5 lowercase tags"]}
Focus tags on online discourse themes (ai, social-media, politics, culture, etc.) when relevant.`,
    },
    { role: "user", content: text },
  ]);

  if (!content) return null;

  try {
    const raw = JSON.parse(content) as { species?: string; tags?: string[] };

    if (!raw.species || !SPECIES_LIST.includes(raw.species as Species)) {
      return null;
    }

    const tags = (raw.tags ?? [])
      .map((tag: string) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);

    return {
      species: raw.species as Species,
      tags: tags.length > 0 ? tags : suggestTags(text, raw.species as Species),
      source: "ai",
    };
  } catch {
    return null;
  }
}

export async function suggestQuestionMetadata(
  text: string,
): Promise<QuestionSuggestion | null> {
  const trimmed = text.trim();
  if (trimmed.length < 12) return null;

  const fromAi = await suggestWithAi(trimmed);
  if (fromAi) return fromAi;

  return suggestQuestionMetadataHeuristic(trimmed);
}
