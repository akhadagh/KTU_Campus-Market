import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Campus Market",
    template: "%s | Campus Market",
  },
  description:
    "Everything you need, right around campus. Discover products, shop from fellow students, and grow your business.",
  applicationName: "Campus Market",
};

// Every page in this app reads the session cookie and the database while
// rendering, so a fully static shell cannot be produced. Opt out of the
// static-shell and instant-navigation validation for the whole tree.
export const instant = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f3a",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
