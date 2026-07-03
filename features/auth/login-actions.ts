"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatAuthError } from "./auth-errors";

export interface MagicLinkResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function sendMagicLinkViaResend(
  email: string,
  actionLink: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, error: "Resend is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Sign in to Question Species",
      html: `
        <p>Click the link below to sign in to Question Species:</p>
        <p><a href="${actionLink}">Sign in</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p style="color:#666;font-size:12px">Link expires after a short time.</p>
      `,
      text: `Sign in to Question Species: ${actionLink}`,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    return {
      ok: false,
      error: body?.message ?? "Could not send sign-in email.",
    };
  }

  return { ok: true };
}

/**
 * Sends a magic link without using Supabase's built-in SMTP (2 emails/hour cap).
 * Requires SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY on the server.
 */
async function sendMagicLinkViaAdminAndResend(
  email: string,
  redirectTo: string,
): Promise<MagicLinkResult | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return null;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error) {
      return { success: false, error: formatAuthError(error.message) };
    }

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
      return { success: false, error: "Could not create a sign-in link." };
    }

    const sent = await sendMagicLinkViaResend(email, actionLink);
    if (!sent.ok) {
      return {
        success: false,
        error: formatAuthError(sent.error ?? "Could not send sign-in email."),
      };
    }

    return {
      success: true,
      message: "Check your email for a magic link to sign in.",
    };
  } catch {
    return null;
  }
}

export async function requestMagicLink(
  email: string,
  redirectTo: string,
): Promise<MagicLinkResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: "Enter your email address." };
  }

  const viaResend = await sendMagicLinkViaAdminAndResend(
    normalizedEmail,
    redirectTo,
  );
  if (viaResend) {
    return viaResend;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { success: false, error: formatAuthError(error.message) };
  }

  return {
    success: true,
    message: "Check your email for a magic link to sign in.",
  };
}
