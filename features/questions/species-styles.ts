import type { Species } from "@/types";

export interface SpeciesStyle {
  label: string;
  emoji: string;
  /** Badge pill on cards */
  badge: string;
  /** Feed card surface */
  card: string;
  cardHover: string;
  accent: string;
  /** Filter tab — active state */
  tabActive: string;
  /** Filter tab — inactive state */
  tabInactive: string;
  /** Question page hero header */
  header: string;
  icon: string;
  ring: string;
  muted: string;
  cta: string;
}

export const SPECIES_STYLES: Record<Species, SpeciesStyle> = {
  puzzle: {
    label: "Puzzle",
    emoji: "🧩",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    card:
      "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white dark:border-blue-900/60 dark:from-blue-950/40 dark:to-zinc-900",
    cardHover:
      "hover:border-blue-300 hover:shadow-blue-200/50 dark:hover:border-blue-700 dark:hover:shadow-blue-950/30",
    accent: "bg-blue-500 dark:bg-blue-400",
    tabActive: "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-950/50",
    tabInactive:
      "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-950",
    header:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:border-blue-900 dark:from-blue-950/50 dark:via-zinc-900 dark:to-blue-950/30",
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    ring: "ring-blue-200 dark:ring-blue-800",
    muted: "text-blue-600 dark:text-blue-400",
    cta: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  },
  opinion: {
    label: "Opinion",
    emoji: "🤔",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    card:
      "border-purple-200/80 bg-gradient-to-br from-purple-50/90 to-white dark:border-purple-900/60 dark:from-purple-950/40 dark:to-zinc-900",
    cardHover:
      "hover:border-purple-300 hover:shadow-purple-200/50 dark:hover:border-purple-700 dark:hover:shadow-purple-950/30",
    accent: "bg-purple-500 dark:bg-purple-400",
    tabActive:
      "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-950/50",
    tabInactive:
      "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-950",
    header:
      "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 dark:border-purple-900 dark:from-purple-950/50 dark:via-zinc-900 dark:to-purple-950/30",
    icon: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    ring: "ring-purple-200 dark:ring-purple-800",
    muted: "text-purple-600 dark:text-purple-400",
    cta: "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600",
  },
  prediction: {
    label: "Prediction",
    emoji: "🔮",
    badge: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    card:
      "border-green-200/80 bg-gradient-to-br from-green-50/90 to-white dark:border-green-900/60 dark:from-green-950/40 dark:to-zinc-900",
    cardHover:
      "hover:border-green-300 hover:shadow-green-200/50 dark:hover:border-green-700 dark:hover:shadow-green-950/30",
    accent: "bg-green-500 dark:bg-green-400",
    tabActive:
      "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-950/50",
    tabInactive:
      "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-300 dark:hover:bg-green-950",
    header:
      "border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/50 dark:border-green-900 dark:from-green-950/50 dark:via-zinc-900 dark:to-green-950/30",
    icon: "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300",
    ring: "ring-green-200 dark:ring-green-800",
    muted: "text-green-600 dark:text-green-400",
    cta: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
  },
  estimation: {
    label: "Estimation",
    emoji: "📊",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    card:
      "border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white dark:border-orange-900/60 dark:from-orange-950/40 dark:to-zinc-900",
    cardHover:
      "hover:border-orange-300 hover:shadow-orange-200/50 dark:hover:border-orange-700 dark:hover:shadow-orange-950/30",
    accent: "bg-orange-500 dark:bg-orange-400",
    tabActive:
      "bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-950/50",
    tabInactive:
      "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-950",
    header:
      "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-50/50 dark:border-orange-900 dark:from-orange-950/50 dark:via-zinc-900 dark:to-orange-950/30",
    icon: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    ring: "ring-orange-200 dark:ring-orange-800",
    muted: "text-orange-600 dark:text-orange-400",
    cta: "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600",
  },
  brainstorm: {
    label: "Brainstorm",
    emoji: "💡",
    badge: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
    card:
      "border-pink-200/80 bg-gradient-to-br from-pink-50/90 to-white dark:border-pink-900/60 dark:from-pink-950/40 dark:to-zinc-900",
    cardHover:
      "hover:border-pink-300 hover:shadow-pink-200/50 dark:hover:border-pink-700 dark:hover:shadow-pink-950/30",
    accent: "bg-pink-500 dark:bg-pink-400",
    tabActive: "bg-pink-600 text-white shadow-md shadow-pink-200 dark:shadow-pink-950/50",
    tabInactive:
      "bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/50 dark:text-pink-300 dark:hover:bg-pink-950",
    header:
      "border-pink-200 bg-gradient-to-br from-pink-50 via-white to-pink-50/50 dark:border-pink-900 dark:from-pink-950/50 dark:via-zinc-900 dark:to-pink-950/30",
    icon: "bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300",
    ring: "ring-pink-200 dark:ring-pink-800",
    muted: "text-pink-600 dark:text-pink-400",
    cta: "bg-pink-600 text-white hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600",
  },
};

export function getSpeciesStyle(species: Species): SpeciesStyle {
  return SPECIES_STYLES[species];
}

/** Intro banner on the home feed (all-tab hero). */
export const FEED_HERO_STYLE = {
  emoji: "🧠",
  accent: "bg-teal-500 dark:bg-teal-400",
  card:
    "border-teal-200/90 bg-gradient-to-br from-teal-50/95 via-white to-teal-50/70 dark:border-teal-800/70 dark:from-teal-950/55 dark:via-zinc-900 dark:to-teal-950/45",
  icon: "bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200",
  ring: "ring-teal-200 dark:ring-teal-800",
  muted: "text-teal-900 dark:text-teal-100",
} as const;

export const ALL_SPECIES = Object.keys(SPECIES_STYLES) as Species[];

export const SPECIES_META = ALL_SPECIES.map((id) => ({
  id,
  label: SPECIES_STYLES[id].label,
  emoji: SPECIES_STYLES[id].emoji,
}));

export function getSpeciesMeta(species: Species) {
  return SPECIES_META.find((s) => s.id === species)!;
}
