import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Customer reviews" };

export default async function VendorReviewsPage() {
  const auth = await requireVendor();

  const reviews = await prisma.review.findMany({
    where: { vendorId: auth.vendorId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      comment: true,
      status: true,
      verifiedPurchase: true,
      createdAt: true,
      buyer: { select: { fullName: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  const average =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;

  return (
    <div>
      <PageHeader
        title="Customer reviews"
        description="Reviews of your products. Only published reviews are visible to students."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total reviews", value: String(reviews.length) },
          { label: "Average rating", value: average > 0 ? `${average.toFixed(1)} / 5` : "—" },
          {
            label: "Awaiting moderation",
            value: String(reviews.filter((review) => review.status === "PENDING").length),
          },
        ].map((card) => (
          <Card key={card.label} className="border-neutral-200/80 p-5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-bold text-neutral-900">{card.value}</p>
          </Card>
        ))}
      </div>

      {reviews.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Students can review your products after a delivered order."
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {review.product?.name ?? "Product"}
                    </p>
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {review.rating}/5
                    </span>
                    <Badge
                      variant={
                        review.status === "PUBLISHED"
                          ? "success"
                          : review.status === "PENDING"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {review.status}
                    </Badge>
                    {review.verifiedPurchase ? (
                      <Badge variant="muted">Verified purchase</Badge>
                    ) : null}
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{review.comment}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-neutral-500">
                    {review.buyer.fullName} ·{" "}
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                      review.createdAt,
                    )}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
