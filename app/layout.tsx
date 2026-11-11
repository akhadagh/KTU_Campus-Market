import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
  title: {
    default: "JUMART — Your Campus. Your Marketplace.",
    template: "%s | JUMART",
  },
  description:
    "JUMART connects students, vendors and service providers on one campus marketplace. Buy and sell laptops, fashion, food, study materials and airtime bundles, all around your campus.",
  applicationName: "JUMART",
  keywords: [
    "JUMART",
    "campus marketplace",
    "student marketplace",
    "Ghana",
    "buy and sell on campus",
    "airtime bundles",
    "past questions",
  ],
  authors: [{ name: "JUMART" }],
  creator: "JUMART",
  openGraph: {
    type: "website",
    siteName: "JUMART",
    title: "JUMART — Your Campus. Your Marketplace.",
    description:
      "Shop laptops, fashion, food and study materials from verified vendors on your campus. Buy and sell with confidence.",
    images: [{ url: "/brand/jumart-og.png", width: 1200, height: 630, alt: "JUMART" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JUMART — Your Campus. Your Marketplace.",
    description:
      "Shop laptops, fashion, food and study materials from verified vendors on your campus.",
    images: ["/brand/jumart-og.png"],
  },
  icons: {
    icon: [
      { url: "/brand/jumart-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/jumart-favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/jumart-app-icon.png", sizes: "512x512", type: "image/png" }],
  },
};

// Every page in this app reads the session cookie and the database while
// rendering, so a fully static shell cannot be produced. Opt out of the
// static-shell and instant-navigation validation for the whole tree.
export const instant = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B087D",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="bg-canvas text-ink min-h-screen antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
