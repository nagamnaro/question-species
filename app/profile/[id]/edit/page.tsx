import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { ProfileEditForm } from "@/features/profile/ProfileEditForm";
import { getAuthUserId } from "@/features/responses/queries";
import {
  formatUserDisplayName,
  getUserProfile,
} from "@/features/social/queries";

interface ProfileEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileEditPage({ params }: ProfileEditPageProps) {
  const { id } = await params;
  const [profile, currentUserId] = await Promise.all([
    getUserProfile(id),
    getAuthUserId(),
  ]);

  if (!profile) {
    notFound();
  }

  if (!currentUserId) {
    redirect(`/login?next=/profile/${id}/edit`);
  }

  if (currentUserId !== id) {
    redirect(`/profile/${id}`);
  }

  const displayName = formatUserDisplayName(profile);

  return (
    <FeedLayout>
      <div className="space-y-6">
        <Link
          href={`/profile/${id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to profile
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Edit profile
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            How you appear to others across the app.
          </p>

          <div className="mt-6">
            <ProfileEditForm
              initialDisplayName={displayName}
              initialBio={profile.bio ?? ""}
              initialAvatarUrl={profile.avatar_url}
              profileId={id}
            />
          </div>
        </div>
      </div>
    </FeedLayout>
  );
}
