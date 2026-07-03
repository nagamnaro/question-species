import type { Species } from "@/types";
import { getSpeciesStyle } from "./species-styles";

interface SpeciesIconProps {
  species: Species;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "h-8 w-8 text-base",
  md: "h-11 w-11 text-xl",
  lg: "h-14 w-14 text-2xl",
};

export function SpeciesIcon({ species, size = "md" }: SpeciesIconProps) {
  const style = getSpeciesStyle(species);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl ring-2 ${style.icon} ${style.ring} ${SIZE[size]}`}
      aria-hidden="true"
    >
      {style.emoji}
    </div>
  );
}

interface SpeciesBadgeProps {
  species: Species;
}

export function SpeciesBadge({ species }: SpeciesBadgeProps) {
  const style = getSpeciesStyle(species);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${style.badge}`}
    >
      <span aria-hidden="true">{style.emoji}</span>
      {style.label}
    </span>
  );
}
