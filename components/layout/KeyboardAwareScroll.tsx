"use client";

import { useEffect } from "react";

const FOCUSABLE = "input:not([type=hidden]), textarea, select";

function scrollIntoViewAboveKeyboard(element: HTMLElement) {
  const viewport = window.visualViewport;

  if (!viewport) {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const rect = element.getBoundingClientRect();
  const visibleTop = viewport.offsetTop;
  const visibleBottom = viewport.offsetTop + viewport.height;
  const padding = 20;

  if (rect.bottom > visibleBottom - padding) {
    window.scrollBy({
      top: rect.bottom - visibleBottom + padding + 32,
      behavior: "smooth",
    });
    return;
  }

  if (rect.top < visibleTop + padding) {
    window.scrollBy({
      top: rect.top - visibleTop - padding,
      behavior: "smooth",
    });
  }
}

function scheduleScroll(element: HTMLElement) {
  scrollIntoViewAboveKeyboard(element);
  window.setTimeout(() => scrollIntoViewAboveKeyboard(element), 120);
  window.setTimeout(() => scrollIntoViewAboveKeyboard(element), 320);
}

/** Keeps focused fields visible above the mobile keyboard without zooming the page. */
export function KeyboardAwareScroll() {
  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(FOCUSABLE)) return;
      scheduleScroll(target);
    }

    function onViewportChange() {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.matches(FOCUSABLE)) {
        scrollIntoViewAboveKeyboard(active);
      }
    }

    document.addEventListener("focusin", onFocusIn);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  return null;
}
