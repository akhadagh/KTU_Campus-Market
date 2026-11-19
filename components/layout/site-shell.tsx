import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSession } from "@/lib/auth/session";

export async function SiteShell({ children }: { children: ReactNode }) {
  let isAuthenticated = false;
  try {
    isAuthenticated = Boolean(await getSession());
  } catch {
    isAuthenticated = false;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="focus:bg-brand-900 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <AppHeader isAuthenticated={isAuthenticated} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}
