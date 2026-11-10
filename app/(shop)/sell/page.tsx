import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Camera, PackagePlus, Store, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Sell on Campus Market",
  description: "Open a campus store, list products, and manage orders.",
};

const steps = [
  {
    icon: Store,
    title: "Create your store",
    description: "Choose a store name, describe what you sell, and add a logo.",
  },
  {
    icon: PackagePlus,
    title: "List your products",
    description:
      "Add clear photos, accurate prices, condition, stock, and pickup or delivery options.",
  },
  {
    icon: Wallet,
    title: "Manage orders",
    description: "Accept orders, update fulfilment status, and track sales from your dashboard.",
  },
  {
    icon: Camera,
    title: "Build trust",
    description: "Verification, reviews, and reporting help buyers shop with confidence.",
  },
];

export default function SellPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Sell on Campus Market"
        description="Turn your campus hustle into a storefront. One account lets you buy and sell."
        actions={
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Create an account
          </Link>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Alert variant="info" title="Vendor onboarding is being built">
            Vendor applications, store creation, and product publishing are implemented in Milestone
            4. Until then, no store can be created and no listing can be published.
          </Alert>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="p-5">
                  <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-lg">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-sm font-semibold text-neutral-900">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">{step.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="h-fit p-6">
          <Badge variant="success">What you will need</Badge>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            {[
              "A verified student account",
              "A store name and description",
              "Accurate product photos and prices",
              "Pickup or delivery preferences",
              "Agreement to marketplace policies",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <BadgeCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-xs leading-5 text-neutral-600">
            Vendor approval and student verification are separate checks. Registration alone does
            not make an account a verified vendor.
          </div>
        </Card>
      </div>
    </div>
  );
}
