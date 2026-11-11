import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, PackagePlus, Store, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { statusBadgeVariant, vendorStatusLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = {
  title: "Sell on Campus Market",
  description: "Open a campus store, list products, and manage orders.",
};

const steps = [
  {
    icon: Store,
    title: "Create your store",
    description: "Choose a store name, describe what you sell, and tell buyers how to reach you.",
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

const statusCopy: Record<string, string> = {
  PENDING: "Your application is waiting for administrator review. You cannot list products yet.",
  PAUSED: "Your store is paused. Reactivation is handled by an administrator.",
  SUSPENDED: "Your store is suspended. Contact support for details and next steps.",
  CLOSED: "This store is closed. If your application was rejected you can apply again.",
};

function Marketing() {
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
          <Alert variant="info" title="Applications are reviewed by an administrator">
            Submit your store details, then an administrator approves it before your listings go
            live. This keeps the marketplace trustworthy for buyers.
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
              "A Campus Market account",
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

export default async function SellPage() {
  const session = await getSession();
  if (!session) return <Marketing />;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      storeName: true,
      slug: true,
      status: true,
      verificationStatus: true,
      createdAt: true,
    },
  });

  if (!vendor) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Start selling"
          description="You are signed in. Apply for a store and start listing once approved."
        />
        <Card className="mt-6 p-6">
          {!session.user.emailVerifiedAt ? (
            <Alert
              variant="warning"
              title="Verify your email for a smoother review"
              className="mb-4"
            >
              Your email is not verified yet. You can still apply, but administrators may ask you to
              verify before approving your store.
            </Alert>
          ) : null}
          <p className="text-sm leading-6 text-neutral-600">
            A store application asks for your store name, what you sell, contact details, and how
            buyers receive orders. It takes about two minutes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/sell/apply" className={buttonVariants({ size: "lg" })}>
              Apply to sell
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/marketplace"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse the marketplace
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (vendor.status !== "ACTIVE") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title={vendor.storeName} description="Seller workspace" />
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-neutral-900">{vendor.storeName}</p>
            <Badge variant={statusBadgeVariant(vendor.status)}>
              {vendorStatusLabels[vendor.status] ?? vendor.status}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {statusCopy[vendor.status] ?? "Your store is not active."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/sell/pending" className={buttonVariants({ variant: "outline" })}>
              View application status
            </Link>
            {vendor.status === "CLOSED" && vendor.verificationStatus === "REJECTED" ? (
              <Link href="/sell/apply" className={buttonVariants()}>
                Apply again
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  const [productCounts, pendingOrders, revenue] = await Promise.all([
    prisma.product.groupBy({
      by: ["status"],
      where: { vendorId: vendor.id, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.vendorOrder.count({
      where: {
        vendorId: vendor.id,
        status: {
          in: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        },
      },
    }),
    prisma.vendorOrder.aggregate({
      where: { vendorId: vendor.id, status: "DELIVERED" },
      _sum: { totalPesewas: true },
    }),
  ]);
  const countByStatus = Object.fromEntries(
    productCounts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={vendor.storeName}
        description="Your seller dashboard at a glance."
        actions={
          <Link href="/sell/products/new" className={buttonVariants({ size: "lg" })}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active listings", value: countByStatus["ACTIVE"] ?? 0 },
          { label: "Pending review", value: countByStatus["PENDING_REVIEW"] ?? 0 },
          { label: "Open orders", value: pendingOrders },
          { label: "Delivered sales", value: formatPesewas(revenue._sum.totalPesewas ?? 0) },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/sell/dashboard" className={buttonVariants()}>
          Open dashboard
        </Link>
        <Link href="/sell/products" className={buttonVariants({ variant: "outline" })}>
          Manage products
        </Link>
        <Link href={`/stores/${vendor.slug}`} className={buttonVariants({ variant: "outline" })}>
          View public store
        </Link>
      </div>
    </div>
  );
}
