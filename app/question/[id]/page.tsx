import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { enrichQuestion } from "@/features/questions/enrich-feed";
import { QuestionHeader } from "@/features/questions/QuestionHeader";
import { hasUserUpvotedQuestion } from "@/features/questions/upvote-queries";
import { getNextQuestion, getQuestionById } from "@/features/questions/queries";
import { AnswerForm } from "@/features/responses/AnswerForm";
import { ResultsView } from "@/features/responses/ResultsView";
import {
  getAuthUserId,
  getCurrentUserResponse,
  getQuestionResponses,
} from "@/features/responses/queries";
import { getFollowingIds } from "@/features/social/queries";

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { id } = await params;
  const [question, userId, userResponse] = await Promise.all([
    getQuestionById(id),
    getAuthUserId(),
    getCurrentUserResponse(id),
  ]);

  if (!question) {
    notFound();
  }

  const [displayQuestion, hasUpvoted] = await Promise.all([
    enrichQuestion(question),
    userId ? hasUserUpvotedQuestion(userId, id) : Promise.resolve(false),
  ]);

  const hasAnswered = userResponse !== null;

  let responses: Awaited<ReturnType<typeof getQuestionResponses>> = [];
  let followingIds: string[] = [];
  let nextQuestion: Awaited<ReturnType<typeof getNextQuestion>> = null;

  if (hasAnswered && userId) {
    [responses, followingIds, nextQuestion] = await Promise.all([
      getQuestionResponses(id),
      getFollowingIds(userId),
      getNextQuestion(id, userId, question.species),
    ]);
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

        <QuestionHeader
          question={displayQuestion}
          isAuthenticated={userId !== null}
          hasUpvoted={hasUpvoted}
        />

        {!userId ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sign in to answer this question
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              You must submit your answer before seeing other responses.
            </p>
            <Link
              href={`/login?next=/question/${id}`}
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Sign in
            </Link>
          </div>
        ) : hasAnswered && userId ? (
          <ResultsView
            question={question}
            responses={responses}
            currentUserId={userId}
            followingIds={followingIds}
            nextQuestion={nextQuestion}
          />
        ) : (
          <AnswerForm question={question} />
        )}
      </div>
    </FeedLayout>
  );
}
