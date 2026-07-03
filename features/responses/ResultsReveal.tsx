"use client";

interface ResultsRevealProps {
  children: React.ReactNode;
}

export function ResultsReveal({ children }: ResultsRevealProps) {
  return <div className="results-reveal space-y-6">{children}</div>;
}
