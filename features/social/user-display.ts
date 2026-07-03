/** Public-safe user fields — never expose email in social UI. */
export interface PublicUserFields {
  display_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export function formatPublicDisplayName(
  user: PublicUserFields | null | undefined,
): string {
  if (!user) return "User";
  const name = user.display_name?.trim();
  if (name) return name;
  return "User";
}
