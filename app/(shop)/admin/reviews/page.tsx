import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReviewActions, ReviewRating } from "@/components/admin/review-actions";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requirePermission(PERMISSION.PRODUCT_MODERATE);
  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      verifiedPurchase: true,
      buyer: { select: { fullName: true } },
      product: { select: { name: true } },
      vendor: { select: { storeName: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Reviews"
        description="Every review is checked before it appears on a listing."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      {reviews.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-neutral-600">
          No reviews waiting for moderation.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {review.product?.name ?? "Product"}
                    </p>
                    <ReviewRating rating={review.rating} />
                    {review.verifiedPurchase ? (
                      <Badge variant="success">Verified purchase</Badge>
                    ) : null}
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{review.comment}</p>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">No comment provided.</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    {review.buyer.fullName} · {review.vendor.storeName} ·{" "}
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                      review.createdAt,
                    )}
                  </p>
                </div>
                <ReviewActions reviewId={review.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
