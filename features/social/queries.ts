import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/supabase/missing-table";
import type { User } from "@/types";
import {
  formatPublicDisplayName,
  type PublicUserFields,
} from "./user-display";

export type { PublicUserFields };

export interface UserProfile extends User {
  response_count: number;
}

/** @deprecated Use formatPublicDisplayName for social UI. */
export function formatUserDisplayName(
  user: Pick<User, "display_name" | "email"> | PublicUserFields | null | undefined,
): string {
  if (!user) return "User";
  if ("email" in user && user.email) {
    return user.display_name ?? user.email.split("@")[0] ?? "User";
  }
  return formatPublicDisplayName(user);
}

const PUBLIC_USER_COLUMNS_FULL =
  "id, display_name, avatar_url, bio, thinking_tags_json, thinking_tags_updated_at, created_at, updated_at";

const PUBLIC_USER_COLUMNS_BASE =
  "id, display_name, avatar_url, created_at, updated_at";

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();

  const { data: full, error: fullError } = await supabase
    .from("users")
    .select(PUBLIC_USER_COLUMNS_FULL)
    .eq("id", id)
    .maybeSingle();

  if (!fullError) {
    return full as User | null;
  }

  if (isMissingSchemaError(fullError.message)) {
    const { data: base, error: baseError } = await supabase
      .from("users")
      .select(PUBLIC_USER_COLUMNS_BASE)
      .eq("id", id)
      .maybeSingle();

    if (!baseError) {
      return base as User | null;
    }

    if (!isMissingSchemaError(baseError.message)) {
      console.error("Failed to fetch user:", baseError.message);
    }
    return null;
  }

  console.error("Failed to fetch user:", fullError.message);
  return null;
}

export async function getUserResponseCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_response_count", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Failed to count responses:", error.message);
    return 0;
  }

  return data ?? 0;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [user, response_count] = await Promise.all([
    getUserById(userId),
    getUserResponseCount(userId),
  ]);

  if (!user) return null;

  return { ...user, response_count };
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (followerId === followingId) return false;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_id", followerId)
    .eq("friend_id", followingId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) {
    console.error("Failed to check follow status:", error.message);
    return false;
  }

  return data !== null;
}

export async function getFollowingIds(followerId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", followerId)
    .eq("status", "accepted");

  if (error) {
    console.error("Failed to fetch following list:", error.message);
    return [];
  }

  return data?.map((row) => row.friend_id) ?? [];
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("friend_id", userId)
    .eq("status", "accepted");

  if (error) {
    console.error("Failed to count followers:", error.message);
    return 0;
  }

  return count ?? 0;
}
