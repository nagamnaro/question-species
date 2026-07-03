import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { enrichMatchesWithDiscussion } from "@/features/mind-match/enrich";
import { MindMatchSection } from "@/features/mind-match/MindMatchSection";
import { getMindMatchesForUser } from "@/features/mind-match/queries";
import { getAuthUserId } from "@/features/responses/queries";

export default async function MindMatchPage() {
  const userId = await getAuthUserId();

  if (!userId) {
    redirect("/login?next=/mind-match");
  }

  const { align, spark, answeredCount } = await getMindMatchesForUser(userId);
  const [alignWithDiscussion, sparkWithDiscussion] = await Promise.all([
    enrichMatchesWithDiscussion(userId, align),
    enrichMatchesWithDiscussion(userId, spark),
  ]);

  const needsMoreAnswers = answeredCount < 3;

  return (
    <FeedLayout>
      <div className="space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to feed
          </Link>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 to-white px-5 py-6 dark:border-zinc-800 dark:from-indigo-950/40 dark:to-zinc-950">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Mind Match
            </h1>
            <p className="mt-2 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
              Find people who think like you — or disagree in ways that spark
              better questions. Matches need at least 3 shared answers.
            </p>
          </div>
        </div>

        {needsMoreAnswers && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            You&apos;ve answered {answeredCount} question
            {answeredCount !== 1 ? "s" : ""}. Answer a few more to unlock mind
            matches.
          </p>
        )}

        <MindMatchSection
          title="People who think like you"
          description="High agreement on questions you've both answered."
          matches={alignWithDiscussion}
          emptyMessage={
            needsMoreAnswers
              ? "Answer more questions to discover alignments."
              : "No strong alignments yet — try following people and answering more."
          }
        />

        <MindMatchSection
          title="People who challenge you"
          description="Shared curiosity with productive disagreement — great thought partners."
          matches={sparkWithDiscussion}
          emptyMessage={
            needsMoreAnswers
              ? "Answer more questions to find thought partners."
              : "No spark matches yet. Keep answering diverse questions."
          }
        />
      </div>
    </FeedLayout>
  );
}
