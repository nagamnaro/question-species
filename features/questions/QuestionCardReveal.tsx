"use client";

import { useEffect, useRef, useState } from "react";

interface QuestionCardRevealProps {
  accentClassName: string;
  className: string;
  children: React.ReactNode;
}

export function QuestionCardReveal({
  accentClassName,
  className,
  children,
}: QuestionCardRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [dealt, setDealt] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setDealt(true);
      setAnimationReady(true);
      return;
    }

    setAnimationReady(true);

    const reveal = () => {
      setDealt(true);
      observer.disconnect();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) reveal();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);

    const rect = node.getBoundingClientRect();
    const inView =
      rect.top < window.innerHeight * 0.94 &&
      rect.bottom > window.innerHeight * 0.06;

    if (inView) {
      requestAnimationFrame(() => {
        requestAnimationFrame(reveal);
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-deal-ready={animationReady || undefined}
      className={`group relative overflow-hidden ${className}`}
    >
      <div
        className={`question-card-deck-spine absolute left-0 top-0 z-10 h-full w-1.5 opacity-90 ${accentClassName} ${dealt ? "is-dealt" : ""}`}
        aria-hidden="true"
      />

      <div
        className={`question-card-deal-panel relative ${dealt ? "is-dealt" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
