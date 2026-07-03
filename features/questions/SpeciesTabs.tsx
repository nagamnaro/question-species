import Link from "next/link";
import type { Species } from "@/types";
import { SPECIES_STYLES } from "./species-styles";

export type SpeciesFilter = "all" | Species;

const SPECIES_TABS = Object.entries(SPECIES_STYLES).map(([id, style]) => ({
  id: id as Species,
  ...style,
}));

function filterHref(filter: SpeciesFilter): string {
  return filter === "all" ? "/" : `/?species=${filter}`;
}

interface SpeciesTabsProps {
  active: SpeciesFilter;
}

export function SpeciesTabs({ active }: SpeciesTabsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Question Species
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <TabLink
          href={filterHref("all")}
          isActive={active === "all"}
          label="All"
          className={
            active === "all"
              ? "bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }
        />

        {SPECIES_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <TabLink
              key={tab.id}
              href={filterHref(tab.id)}
              isActive={isActive}
              label={tab.label}
              emoji={tab.emoji}
              className={isActive ? tab.tabActive : tab.tabInactive}
            />
          );
        })}
      </div>
    </div>
  );
}

function TabLink({
  href,
  isActive,
  label,
  emoji,
  className,
}: {
  href: string;
  isActive: boolean;
  label: string;
  emoji?: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${className}`}
    >
      {emoji && <span className="mr-1.5">{emoji}</span>}
      {label}
    </Link>
  );
}
