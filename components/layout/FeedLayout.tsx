import { Navbar } from "./Navbar";

export function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 supports-[padding:max(0px)]:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </>
  );
}
