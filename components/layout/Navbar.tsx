"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { StreakBadge } from "./StreakBadge";

function MessagesLink() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function loadUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from("response_private_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null);

      if (!error) {
        setUnreadCount(count ?? 0);
      }
    }

    loadUnread();
  }, [pathname]);

  return (
    <Link
      href="/messages"
      className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      Messages
      {unreadCount > 0 && (
        <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

const navLinkClass =
  "text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)] dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-2xl px-4 py-3 text-center sm:py-4">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div aria-hidden="true" />
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50"
          >
            Question Species
          </Link>
          <div className="flex justify-end">{user ? <StreakBadge /> : null}</div>
        </div>

        <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:mt-3">
          <Link href="/" className={navLinkClass}>
            Feed
          </Link>
          {user ? (
            <>
              <Link href="/mind-match" className={navLinkClass}>
                Mind Match
              </Link>
              <Link href="/submit" className={navLinkClass}>
                Submit
              </Link>
              <MessagesLink />
              <Link href={`/profile/${user.id}`} className={navLinkClass}>
                Profile
              </Link>
              <button type="button" onClick={handleSignOut} className={navLinkClass}>
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
