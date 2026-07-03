"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, uploadAvatar } from "./actions";

interface ProfileEditFormProps {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  profileId: string;
}

export function ProfileEditForm({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  profileId,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setError("Image must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    uploadAvatar(formData)
      .then((result) => {
        if (!result.success) {
          setError(result.error ?? "Upload failed.");
          return;
        }
        if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
      })
      .finally(() => setIsUploading(false));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfile(displayName, bio, avatarUrl);
      if (!result.success) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.push(`/profile/${profileId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Avatar
        </p>
        <div className="mt-2 flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
            {isUploading ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploading}
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          JPEG, PNG, WebP or GIF. Max 1 MB.
        </p>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={50}
          required
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {displayName.length}/50
        </p>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          maxLength={100}
          placeholder="A sentence about how you think, what you're curious about…"
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {bio.length}/100 — visible on your profile
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Profile saved.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
