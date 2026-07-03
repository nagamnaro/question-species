import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import {
  AgreementMap,
  ViewerAgreementCard,
} from "@/features/profile/AgreementMap";
import { ThoughtPartnersSection } from "@/features/profile/ThoughtPartnersSection";
import { getThinkingTagsForUser } from "@/features/profile/thinking-tags-loader";
import { ThinkingTags } from "@/features/profile/ThinkingTags";
import {
  getAgreementMapForUser,
  getMindMatchesForUser,
  getPairAgreementWithUser,
} from "@/features/mind-match/queries";
import { getSharedQuestionLink } from "@/features/messages/queries";
import { getAuthUserId } from "@/features/responses/queries";
import { FollowButton } from "@/features/social/FollowButton";
import {
  formatUserDisplayName,
  getFollowerCount,
  getUserProfile,
  isFollowing,
} from "@/features/social/queries";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const [profile, currentUserId, thinkingTags] = await Promise.all([
    getUserProfile(id),
    getAuthUserId(),
    getThinkingTagsForUser(id),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUserId === id;

  const [following, followerCount, agreementMap, viewerAgreement, mindMatches, discussionLink] =
    await Promise.all([
      currentUserId && !isOwnProfile
        ? isFollowing(currentUserId, id)
        : Promise.resolve(false),
      getFollowerCount(id),
      isOwnProfile && currentUserId
        ? getAgreementMapForUser(currentUserId)
        : Promise.resolve(null),
      currentUserId && !isOwnProfile
        ? getPairAgreementWithUser(currentUserId, id)
        : Promise.resolve(null),
      isOwnProfile && currentUserId
        ? getMindMatchesForUser(currentUserId)
        : Promise.resolve(null),
      currentUserId && !isOwnProfile
        ? getSharedQuestionLink(currentUserId, id)
        : Promise.resolve(null),
    ]);

  const displayName = formatUserDisplayName(profile);

  return (
    <FeedLayout>
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to feed
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {isOwnProfile ? `${displayName} (you)` : displayName}
                </h1>
                {profile.bio && (
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {profile.bio}
                  </p>
                )}
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {followerCount} follower{followerCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {currentUserId ? (
              isOwnProfile ? (
                <Link
                  href={`/profile/${id}/edit`}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  targetUserId={id}
                  initialIsFollowing={following}
                  isOwnProfile={isOwnProfile}
                />
              )
            ) : (
              <Link
                href={`/login?next=/profile/${id}`}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Sign in to follow
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {profile.response_count}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Questions answered
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {followerCount}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Followers
              </p>
            </div>
          </div>
        </div>

        <ThinkingTags tags={thinkingTags} />

        {viewerAgreement && viewerAgreement.sharedCount >= 3 && (
          <ViewerAgreementCard
            displayName={displayName}
            agreementPercent={viewerAgreement.agreementPercent}
            sharedCount={viewerAgreement.sharedCount}
            agreeCount={viewerAgreement.agreeCount}
            discussionLink={discussionLink}
          />
        )}

        {isOwnProfile && mindMatches && mindMatches.spark.length > 0 && (
          <ThoughtPartnersSection
            userId={id}
            sparkMatches={mindMatches.spark}
          />
        )}

        {isOwnProfile && agreementMap && (
          <>
            <AgreementMap
              entries={agreementMap.entries}
              answeredCount={agreementMap.answeredCount}
            />
            <Link
              href="/mind-match"
              className="block rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-medium text-indigo-800 transition-colors hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
            >
              Explore all mind matches →
            </Link>
          </>
        )}

        {!isOwnProfile &&
          currentUserId &&
          viewerAgreement &&
          viewerAgreement.sharedCount < 3 && (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Answer {3 - viewerAgreement.sharedCount} more shared question
              {3 - viewerAgreement.sharedCount !== 1 ? "s" : ""} with{" "}
              {displayName} to see your mind match score.
            </p>
          )}
      </div>
    </FeedLayout>
  );
}
