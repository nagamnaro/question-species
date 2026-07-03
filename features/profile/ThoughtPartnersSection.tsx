import Link from "next/link";
import type { MindMatch } from "@/features/mind-match/types";
import { enrichMatchesWithDiscussion } from "@/features/mind-match/enrich";
import { MindMatchList } from "@/features/mind-match/MindMatchSection";

interface ThoughtPartnersSectionProps {
  userId: string;
  sparkMatches: MindMatch[];
}

export async function ThoughtPartnersSection({
  userId,
  sparkMatches,
}: ThoughtPartnersSectionProps) {
  const enriched = await enrichMatchesWithDiscussion(userId, sparkMatches.slice(0, 4));

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-900 dark:from-violet-950/30 dark:to-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            People you think differently from
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Thought partners with productive disagreement — send a private note
            to explore why.
          </p>
        </div>
        <Link
          href="/mind-match"
          className="shrink-0 text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
        >
          See all
        </Link>
      </div>

      <div className="mt-4">
        <MindMatchList
          matches={enriched}
          emptyMessage="Answer more diverse questions to find thought partners."
        />
      </div>
    </div>
  );
}
