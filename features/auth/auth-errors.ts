/** User-facing copy for Supabase Auth failures. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("429")
  ) {
    return "Too many sign-in emails were sent recently. Try Google sign-in below, wait about an hour, or ask the app owner to enable custom email in Supabase (Authentication → SMTP).";
  }

  if (lower.includes("signup is disabled")) {
    return "New sign-ups are disabled for this app. Contact the app owner.";
  }

  return message;
}
