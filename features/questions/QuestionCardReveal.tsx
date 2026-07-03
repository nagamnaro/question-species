"use client";

import { useEffect, useRef, useState } from "react";

interface QuestionCardRevealProps {
  accentClassName: string;
  panelClassName: string;
  children: React.ReactNode;
}

export function QuestionCardReveal({
  accentClassName,
  panelClassName,
  children,
}: QuestionCardRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setInView(true);
      setAnimationReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setAnimationReady(true);
        setInView(entry.isIntersecting);
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-deal-ready={animationReady || undefined}
      className="group relative w-full overflow-hidden rounded-2xl"
    >
      <div
        className={`question-card-deck-spine absolute left-0 top-0 z-10 h-full w-1.5 opacity-90 ${accentClassName}`}
        aria-hidden="true"
      />

      <div
        className={`question-card-deal-panel ${inView ? "is-in-view" : "is-out-of-view"} ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
