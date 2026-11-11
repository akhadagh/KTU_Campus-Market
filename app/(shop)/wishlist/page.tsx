import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/wishlist");

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    select: {
      items: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              pricePesewas: true,
              originalPricePesewas: true,
              quantity: true,
              status: true,
              images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
              category: { select: { name: true } },
              vendor: { select: { storeName: true, slug: true } },
            },
          },
        },
      },
    },
  });

  const items = (wishlist?.items ?? []).filter((item) => item.product.status === "ACTIVE");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Wishlist"
        description="Save products you want to revisit. Saved items are private to your account."
      />

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save listings from the marketplace to compare them later."
            action={
              <Link href="/marketplace" className={buttonVariants()}>
                Explore marketplace
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {item.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {item.product.name}
                </Link>
                <p className="text-xs text-neutral-500">
                  {item.product.category.name} · {item.product.vendor.storeName}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {formatPesewas(item.product.pricePesewas)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
