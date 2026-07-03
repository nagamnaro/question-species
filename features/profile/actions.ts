"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";

export interface ProfileActionResult {
  success: boolean;
  error?: string;
  avatarUrl?: string;
}

const DISPLAY_NAME_MAX = 50;
const BIO_MAX = 100;
const AVATAR_MAX_BYTES = 1 * 1024 * 1024;

export async function updateProfile(
  displayName: string,
  bio: string,
  avatarUrl?: string | null,
): Promise<ProfileActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to edit your profile." };
  }

  const trimmedName = displayName.trim();
  const trimmedBio = bio.trim();

  if (!trimmedName) {
    return { success: false, error: "Display name cannot be empty." };
  }

  if (trimmedName.length > DISPLAY_NAME_MAX) {
    return {
      success: false,
      error: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`,
    };
  }

  if (trimmedBio.length > BIO_MAX) {
    return {
      success: false,
      error: `Bio must be ${BIO_MAX} characters or fewer.`,
    };
  }

  const { error } = await supabase
    .from("users")
    .update({
      display_name: trimmedName,
      bio: trimmedBio || null,
      ...(avatarUrl !== undefined ? { avatar_url: avatarUrl || null } : {}),
    })
    .eq("id", user.id);

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        success: false,
        error: "Run migration 20260307197000_profile_bio.sql in Supabase.",
      };
    }
    console.error("Failed to update profile:", error.message);
    return { success: false, error: "Could not save profile." };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath(`/profile/${user.id}/edit`);
  return { success: true, avatarUrl: avatarUrl ?? undefined };
}

export async function uploadAvatar(
  formData: FormData,
): Promise<ProfileActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sign in to upload an avatar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose an image file." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { success: false, error: "Image must be 1 MB or smaller." };
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    if (isMissingSchemaError(uploadError.message)) {
      return {
        success: false,
        error: "Run migration 20260307200000_avatars_storage.sql in Supabase.",
      };
    }
    console.error("Avatar upload failed:", uploadError.message);
    return { success: false, error: "Could not upload avatar." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: "Uploaded but could not save profile." };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath(`/profile/${user.id}/edit`);
  return { success: true, avatarUrl: publicUrl };
}
