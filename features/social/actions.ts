"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FollowActionResult {
  success: boolean;
  error?: string;
  isFollowing?: boolean;
}

export async function followUser(targetUserId: string): Promise<FollowActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to follow users." };
  }

  if (user.id === targetUserId) {
    return { success: false, error: "You cannot follow yourself." };
  }

  await supabase.rpc("ensure_current_user_profile");

  const { error } = await supabase.from("friendships").upsert(
    {
      user_id: user.id,
      friend_id: targetUserId,
      status: "accepted",
    },
    { onConflict: "user_id,friend_id" },
  );

  if (error) {
    console.error("Failed to follow user:", error.message);
    return { success: false, error: "Failed to follow user. Please try again." };
  }

  revalidatePath(`/profile/${targetUserId}`);
  return { success: true, isFollowing: true };
}

export async function unfollowUser(targetUserId: string): Promise<FollowActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to unfollow users." };
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", targetUserId);

  if (error) {
    console.error("Failed to unfollow user:", error.message);
    return { success: false, error: "Failed to unfollow user. Please try again." };
  }

  revalidatePath(`/profile/${targetUserId}`);
  return { success: true, isFollowing: false };
}

export async function toggleFollow(
  targetUserId: string,
  currentlyFollowing: boolean,
): Promise<FollowActionResult> {
  return currentlyFollowing
    ? unfollowUser(targetUserId)
    : followUser(targetUserId);
}
