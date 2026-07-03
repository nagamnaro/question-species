import { FeedLayout } from "@/components/layout/FeedLayout";
import {
  buildEchoProfileForUser,
  diversifyFeedOrder,
  diversifySpeciesFeedOrder,
  enrichSignalsWithAntiEcho,
} from "@/features/questions/anti-echo";
import { buildFeedSignalsMap } from "@/features/questions/feed-signals";
import { enrichQuestionsForFeed } from "@/features/questions/enrich-feed";
import { QuestionFeed } from "@/features/questions/QuestionFeed";
import {
  getFeedSocialStats,
  getQuestions,
  parseSpeciesFilter,
} from "@/features/questions/queries";
import { getQuestionInsightsBatch } from "@/features/insights/queries";
import { getAuthUserId } from "@/features/responses/queries";
import { getFollowingIds } from "@/features/social/queries";
import { getUserUpvotedQuestionIds } from "@/features/questions/upvote-queries";
import type { SpeciesFilter } from "@/features/questions/SpeciesTabs";

interface HomeProps {
  searchParams: Promise<{ species?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { species: speciesParam } = await searchParams;
  const species = parseSpeciesFilter(speciesParam);
  const activeFilter: SpeciesFilter = species ?? "all";

  const [rawQuestions, userId] = await Promise.all([
    getQuestions(species),
    getAuthUserId(),
  ]);

  const questionIds = rawQuestions.map((question) => question.id);
  const followingIds = userId ? await getFollowingIds(userId) : [];

  const [
    enrichedQuestions,
    upvotedQuestionIds,
    statsRows,
    insightClusters,
    echoProfile,
  ] = await Promise.all([
    enrichQuestionsForFeed(rawQuestions),
    userId
      ? getUserUpvotedQuestionIds(userId, questionIds)
      : Promise.resolve(new Set<string>()),
    getFeedSocialStats(questionIds, followingIds),
    getQuestionInsightsBatch(questionIds),
    userId ? buildEchoProfileForUser(userId) : Promise.resolve(null),
  ]);

  const baseSignals = buildFeedSignalsMap(
    enrichedQuestions,
    statsRows,
    followingIds.length,
  );

  const feedSignals = enrichSignalsWithAntiEcho(
    enrichedQuestions,
    baseSignals,
    insightClusters,
    echoProfile,
  );

  const questions =
    activeFilter === "all"
      ? diversifyFeedOrder(enrichedQuestions, feedSignals, echoProfile)
      : diversifySpeciesFeedOrder(enrichedQuestions, feedSignals, echoProfile);

  return (
    <FeedLayout>
      <QuestionFeed
        questions={questions}
        activeFilter={activeFilter}
        feedSignals={feedSignals}
        isAuthenticated={userId !== null}
        upvotedQuestionIds={upvotedQuestionIds}
        showAntiEchoNote={activeFilter === "all"}
      />
    </FeedLayout>
  );
}
