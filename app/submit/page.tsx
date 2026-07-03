import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { SubmitQuestionForm } from "@/features/questions/SubmitQuestionForm";
import { getAuthUserId } from "@/features/responses/queries";

export default async function SubmitQuestionPage() {
  const userId = await getAuthUserId();

  if (!userId) {
    redirect("/login?next=/submit");
  }

  return (
    <FeedLayout>
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to feed
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-teal-50 to-white px-5 py-6 dark:border-zinc-800 dark:from-teal-950/40 dark:to-zinc-950">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Submit a question
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
            Add a curiosity prompt for the community. Pick the species that best
            fits how people should answer.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <SubmitQuestionForm />
        </div>
      </div>
    </FeedLayout>
  );
}
