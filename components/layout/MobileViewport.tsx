"use client";

import { useEffect } from "react";

/** Phone reference frame (iPhone 14 class) for proportional scaling on narrow screens. */
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

function isPhonePortrait(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px) and (orientation: portrait)").matches;
}

function applyPhoneViewportScale() {
  const root = document.documentElement;

  if (!isPhonePortrait()) {
    root.style.removeProperty("--phone-scale");
    root.style.removeProperty("--phone-offset-x");
    root.style.removeProperty("--phone-offset-y");
    return;
  }

  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;

  const scale = Math.min(vw / PHONE_WIDTH, vh / PHONE_HEIGHT, 1);
  const scaledWidth = PHONE_WIDTH * scale;
  const scaledHeight = PHONE_HEIGHT * scale;

  root.style.setProperty("--phone-scale", String(scale));
  root.style.setProperty(
    "--phone-offset-x",
    `${Math.max(0, (vw - scaledWidth) / 2)}px`,
  );
  root.style.setProperty(
    "--phone-offset-y",
    `${Math.max(0, (vh - scaledHeight) / 2)}px`,
  );
}

/**
 * Keeps the app at device-native zoom on desktop, and on phone portrait
 * scales the UI to a standard phone aspect ratio so friends don't need to pinch.
 */
export function MobileViewport() {
  useEffect(() => {
    applyPhoneViewportScale();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", applyPhoneViewportScale);
    viewport?.addEventListener("scroll", applyPhoneViewportScale);
    window.addEventListener("resize", applyPhoneViewportScale);
    window.addEventListener("orientationchange", applyPhoneViewportScale);

    return () => {
      viewport?.removeEventListener("resize", applyPhoneViewportScale);
      viewport?.removeEventListener("scroll", applyPhoneViewportScale);
      window.removeEventListener("resize", applyPhoneViewportScale);
      window.removeEventListener("orientationchange", applyPhoneViewportScale);
    };
  }, []);

  return null;
}
