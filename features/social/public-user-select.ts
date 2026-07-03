import { isMissingSchemaError } from "@/lib/supabase/missing-table";

/** Safe for base schema (no bio / thinking_tags migrations required). */
export const PUBLIC_USER_EMBED = "display_name, avatar_url";

/** Profile fields — requires 20260307197000_profile_bio.sql */
export const PUBLIC_USER_EMBED_WITH_BIO = "display_name, avatar_url, bio";

/** Display-name only — for joins that never need avatar/bio. */
export const PUBLIC_USER_EMBED_MINIMAL = "display_name";

export function isMissingColumnError(message: string): boolean {
  return isMissingSchemaError(message);
}

/**
 * Pick the richest user embed select that the current DB schema supports.
 * Falls back when optional columns (bio) are not migrated yet.
 */
export function resolvePublicUserEmbed(
  errorMessage: string,
  current: string,
): string | null {
  if (!isMissingColumnError(errorMessage)) return null;

  if (current.includes("bio")) {
    return PUBLIC_USER_EMBED;
  }

  if (current.includes("avatar_url")) {
    return PUBLIC_USER_EMBED_MINIMAL;
  }

  return null;
}
