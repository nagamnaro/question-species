import type { Species } from "@/types";
import { SPECIES_STYLES } from "@/features/questions/species-styles";

export interface UserThinkingStats {
  responseCount: number;
  reasoningCount: number;
  speciesCounts: Partial<Record<Species, number>>;
}

export interface ThinkingTag {
  label: string;
  description: string;
  className: string;
}

const TAG_STYLES = {
  primary:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  secondary:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  accent:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  neutral:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
} as const;

const SPECIES_TAG_LABELS: Record<Species, string> = {
  puzzle: "Puzzle solver",
  opinion: "Opinion explorer",
  prediction: "Future gazer",
  estimation: "Number cruncher",
  brainstorm: "Idea generator",
};

export function deriveThinkingTags(stats: UserThinkingStats): ThinkingTag[] {
  const tags: ThinkingTag[] = [];

  if (stats.responseCount === 0) {
    return [
      {
        label: "Getting started",
        description: "Answer a few questions to reveal your thinking style.",
        className: TAG_STYLES.neutral,
      },
    ];
  }

  const speciesEntries = Object.entries(stats.speciesCounts) as [
    Species,
    number,
  ][];
  speciesEntries.sort((a, b) => b[1] - a[1]);

  const topSpecies = speciesEntries[0];
  if (topSpecies) {
    const [species, count] = topSpecies;
    const share = Math.round((count / stats.responseCount) * 100);
    tags.push({
      label: SPECIES_TAG_LABELS[species],
      description: `${share}% of answers are ${SPECIES_STYLES[species].label.toLowerCase()} questions.`,
      className: TAG_STYLES.primary,
    });
  }

  const secondSpecies = speciesEntries[1];
  if (secondSpecies && secondSpecies[1] >= 2) {
    tags.push({
      label: SPECIES_TAG_LABELS[secondSpecies[0]],
      description: `Also drawn to ${SPECIES_STYLES[secondSpecies[0]].label.toLowerCase()} prompts.`,
      className: TAG_STYLES.secondary,
    });
  }

  const reasoningRate = Math.round(
    (stats.reasoningCount / stats.responseCount) * 100,
  );
  if (reasoningRate >= 50) {
    tags.push({
      label: "Shows their work",
      description: `Adds reasoning on ${reasoningRate}% of answers.`,
      className: TAG_STYLES.accent,
    });
  } else if (stats.responseCount >= 5 && reasoningRate <= 15) {
    tags.push({
      label: "Decisive",
      description: "Answers quickly without much extra explanation.",
      className: TAG_STYLES.neutral,
    });
  }

  if (speciesEntries.length >= 4) {
    tags.push({
      label: "Species hopper",
      description: "Explores many different question types.",
      className: TAG_STYLES.secondary,
    });
  }

  return tags.slice(0, 4);
}

export function parseSpeciesCounts(
  raw: Record<string, number> | null | undefined,
): Partial<Record<Species, number>> {
  if (!raw) return {};

  const result: Partial<Record<Species, number>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      key === "puzzle" ||
      key === "opinion" ||
      key === "prediction" ||
      key === "estimation" ||
      key === "brainstorm"
    ) {
      result[key] = Number(value);
    }
  }
  return result;
}
