import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="bg-brand-50 text-brand-700 grid h-14 w-14 place-items-center rounded-full">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-wide text-neutral-500 uppercase">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          We could not find that page
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">
          The page may have moved, or the listing or store may no longer be available.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Go home
          </Link>
          <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
            Explore marketplace
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
