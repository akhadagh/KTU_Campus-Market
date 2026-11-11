import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CreditCard, PackageCheck, Search, Store, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "How it works",
  description: "How buying, selling, pickup, delivery, and payments are designed to work.",
};

const buyerSteps = [
  {
    icon: Search,
    title: "Discover products",
    description:
      "Search or browse categories, then filter by price, condition, campus, and availability.",
  },
  {
    icon: Store,
    title: "Check the vendor",
    description:
      "Review the storefront, verification status, ratings, and pickup or delivery options.",
  },
  {
    icon: CreditCard,
    title: "Checkout securely",
    description:
      "The server recalculates prices and stock before creating the order and starting payment.",
  },
  {
    icon: Truck,
    title: "Receive your order",
    description:
      "Track fulfilment and confirm pickup or delivery. Payment is verified on the server.",
  },
];

const sellerSteps = [
  {
    icon: BadgeCheck,
    title: "Verify your account",
    description: "Student verification and vendor approval are separate, reviewable steps.",
  },
  {
    icon: Store,
    title: "Create a store",
    description: "Add a store name, description, logo, and campus.",
  },
  {
    icon: PackageCheck,
    title: "Publish listings",
    description:
      "Use clear photos, accurate descriptions, condition, stock, and delivery settings.",
  },
  {
    icon: Truck,
    title: "Fulfil orders",
    description:
      "Accept orders, update status, and coordinate pickup or delivery from your dashboard.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="How JUMART works"
        description="A marketplace designed around student budgets, campus logistics, and trust."
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">For buyers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buyerSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-lg">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">For vendors</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sellerSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Start with one account
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          The same account supports buying and selling. Vendor status is granted only after review.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Create account
          </Link>
          <Link href="/sell" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Learn about selling
          </Link>
        </div>
      </div>
    </div>
  );
}
