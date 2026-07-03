import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { InboxList } from "@/features/messages/InboxList";
import { getInboxMessages } from "@/features/messages/queries";
import { getAuthUserId } from "@/features/responses/queries";

export default async function MessagesPage() {
  const userId = await getAuthUserId();

  if (!userId) {
    redirect("/login?next=/messages");
  }

  const messages = await getInboxMessages(userId);

  return (
    <FeedLayout>
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to feed
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 to-white px-5 py-6 dark:border-zinc-800 dark:from-indigo-950/40 dark:to-zinc-950">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Private notes
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
            One-to-one replies on someone&apos;s answer. Only you and they can
            read these — not shown in the public thread.
          </p>
        </div>

        <InboxList messages={messages} />
      </div>
    </FeedLayout>
  );
}
