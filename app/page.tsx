import { FeedLayout } from "@/components/layout/FeedLayout";
import {
  buildEchoProfileForUser,
  enrichSignalsWithAntiEcho,
} from "@/features/questions/anti-echo";
import {
  buildFeedSignalsMap,
  orderFeedByEngagement,
} from "@/features/questions/feed-signals";
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

  const statsRows = await getFeedSocialStats(questionIds, followingIds);
  const baseSignals = buildFeedSignalsMap(
    rawQuestions,
    statsRows,
    followingIds.length,
  );

  const topQuestions = orderFeedByEngagement(rawQuestions, baseSignals);
  const topQuestionIds = topQuestions.map((question) => question.id);
  const topIdSet = new Set(topQuestionIds);
  const topStatsRows = statsRows.filter((row) => topIdSet.has(row.question_id));

  const [
    enrichedQuestions,
    upvotedQuestionIds,
    insightClusters,
    echoProfile,
  ] = await Promise.all([
    enrichQuestionsForFeed(topQuestions),
    userId
      ? getUserUpvotedQuestionIds(userId, topQuestionIds)
      : Promise.resolve(new Set<string>()),
    getQuestionInsightsBatch(topQuestionIds),
    userId ? buildEchoProfileForUser(userId) : Promise.resolve(null),
  ]);

  const feedSignals = enrichSignalsWithAntiEcho(
    enrichedQuestions,
    buildFeedSignalsMap(
      enrichedQuestions,
      topStatsRows,
      followingIds.length,
    ),
    insightClusters,
    echoProfile,
  );

  return (
    <FeedLayout>
      <QuestionFeed
        questions={enrichedQuestions}
        activeFilter={activeFilter}
        feedSignals={feedSignals}
        isAuthenticated={userId !== null}
        upvotedQuestionIds={upvotedQuestionIds}
      />
    </FeedLayout>
  );
}
