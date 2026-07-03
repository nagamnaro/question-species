import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type { Database } from "@/types/database";
export type {
  User,
  Question,
  Response,
  Friendship,
  QuestionInsight,
  Species,
  FriendshipStatus,
  UserInsert,
  QuestionInsert,
  ResponseInsert,
  FriendshipInsert,
  QuestionInsightInsert,
  UserUpdate,
  QuestionUpdate,
  ResponseUpdate,
  FriendshipUpdate,
  QuestionInsightUpdate,
} from "@/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return { url, key };
}

/** Browser-side typed Supabase client (Client Components). */
export function createClient(): TypedSupabaseClient {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}

/** @deprecated Use createClient() — kept for explicit naming at call sites. */
export const createBrowserSupabaseClient = createClient;
