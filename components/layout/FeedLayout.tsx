import { Navbar } from "./Navbar";

export function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
