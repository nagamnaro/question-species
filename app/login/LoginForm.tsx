"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatAuthError } from "@/features/auth/auth-errors";
import { requestMagicLink } from "@/features/auth/login-actions";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_MS = 60_000;
const COOLDOWN_STORAGE_KEY = "qs-magic-link-cooldown";

function getCooldownRemainingMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
  if (!raw) return 0;
  const expiresAt = Number(raw);
  if (Number.isNaN(expiresAt)) return 0;
  return Math.max(0, expiresAt - Date.now());
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(
    authError === "auth"
      ? "Sign-in link expired or was invalid. Request a new one below."
      : null,
  );
  const [isError, setIsError] = useState(authError === "auth");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    setCooldownMs(getCooldownRemainingMs());
  }, []);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const timer = window.setInterval(() => {
      const remaining = getCooldownRemainingMs();
      setCooldownMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownMs]);

  function startCooldown() {
    const expiresAt = Date.now() + RESEND_COOLDOWN_MS;
    sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(expiresAt));
    setCooldownMs(RESEND_COOLDOWN_MS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownMs > 0) return;

    setLoading(true);
    setMessage(null);
    setIsError(false);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const result = await requestMagicLink(email, redirectTo);

    setLoading(false);

    if (!result.success) {
      setIsError(true);
      setMessage(result.error ?? "Could not send magic link.");
      return;
    }

    startCooldown();
    setIsError(false);
    setMessage(result.message ?? "Check your email for a magic link to sign in.");
  }

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setMessage(null);
    setIsError(false);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setOauthLoading(false);

    if (error) {
      setIsError(true);
      setMessage(formatAuthError(error.message));
    }
  }

  const cooldownSeconds = Math.ceil(cooldownMs / 1000);
  const magicLinkDisabled = loading || oauthLoading || cooldownMs > 0;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Use Google or enter your email for a magic link.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || oauthLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <GoogleIcon />
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              or
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={magicLinkDisabled}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading
              ? "Sending…"
              : cooldownMs > 0
                ? `Resend in ${cooldownSeconds}s`
                : "Send magic link"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center text-sm ${
              isError
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm">
          <Link
            href="/"
            className="text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Back to feed
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
