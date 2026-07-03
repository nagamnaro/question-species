import Link from "next/link";
import { markPrivateMessageRead } from "./actions";
import type { PrivateMessageView } from "./types";

interface InboxListProps {
  messages: PrivateMessageView[];
}

export function InboxList({ messages }: InboxListProps) {
  if (messages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No private notes yet. Send one from a question&apos;s results page —
        only you and the recipient will see it.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <InboxItem key={message.id} message={message} />
      ))}
    </ul>
  );
}

async function markRead(messageId: string) {
  "use server";
  await markPrivateMessageRead(messageId);
}

function InboxItem({ message }: { message: PrivateMessageView }) {
  const unread = !message.isSentByMe && message.readAt === null;
  const partnerName = message.isSentByMe
    ? message.recipientName
    : message.senderName;

  return (
    <li
      className={`rounded-xl border p-4 ${
        unread
          ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {message.isSentByMe ? `To ${partnerName}` : `From ${partnerName}`}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
            Re: {message.questionText}
          </p>
        </div>
        {unread && (
          <form action={markRead.bind(null, message.id)}>
            <button
              type="submit"
              className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white"
            >
              Mark read
            </button>
          </form>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {message.body}
      </p>

      <Link
        href={`/question/${message.questionId}#response-${message.responseId}`}
        className="mt-3 inline-block text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
      >
        View in question context →
      </Link>
    </li>
  );
}
