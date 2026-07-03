import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KeyboardAwareScroll } from "@/components/layout/KeyboardAwareScroll";
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

/** Native width; visual viewport shrinks with keyboard so the page can scroll. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
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
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="min-h-dvh font-sans">
        <KeyboardAwareScroll />
        <div id="app-shell" className="min-h-dvh pb-8">
          {children}
        </div>
      </body>
    </html>
  );
}
