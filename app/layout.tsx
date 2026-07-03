import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileViewport } from "@/components/layout/MobileViewport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Question Species",
  description:
    "Answer curated questions, compare reasoning, and discover how humans think.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Question Species",
  },
  formatDetection: {
    telephone: false,
  },
};

/** Fit the layout to phone width; avoid desktop-style scaling on mobile browsers. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">
        <MobileViewport />
        <div id="app-shell" className="flex min-h-dvh flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
