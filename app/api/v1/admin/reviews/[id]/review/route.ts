import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REMOVE"]),
  note: z.string().trim().max(500).optional(),
});

async function refreshRatings(productId: string | null, vendorId: string): Promise<void> {
  const productReviews = await prisma.review.findMany({
    where: { productId: productId ?? undefined, status: "PUBLISHED", deletedAt: null },
    select: { rating: true },
  });
  const vendorReviews = await prisma.review.findMany({
    where: { vendorId, status: "PUBLISHED", deletedAt: null },
    select: { rating: true },
  });

  const average = (ratings: number[]) =>
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 100) / 100
      : 0;

  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: average(productReviews.map((review) => review.rating)),
        ratingCount: productReviews.length,
      },
    });
  }
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      ratingAvg: average(vendorReviews.map((review) => review.rating)),
      ratingCount: vendorReviews.length,
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_MODERATE);
  if (denied) return denied;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Choose a valid decision.", 422);

  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      rating: true,
      status: true,
      productId: true,
      vendorId: true,
      buyerId: true,
    },
  });
  if (!review) return fail("NOT_FOUND", "Review not found.", 404);

  const nextStatus =
    parsed.data.decision === "APPROVE"
      ? "PUBLISHED"
      : parsed.data.decision === "REJECT"
        ? "REJECTED"
        : "REMOVED";

  await prisma.review.update({
    where: { id },
    data: {
      status: nextStatus,
      deletedAt: nextStatus === "REMOVED" ? new Date() : null,
    },
  });

  await refreshRatings(review.productId, review.vendorId);

  await Promise.all([
    createNotification({
      userId: review.buyerId,
      type: "REVIEW",
      title:
        nextStatus === "PUBLISHED"
          ? "Your review is live"
          : nextStatus === "REJECTED"
            ? "Your review was not published"
            : "Your review was removed",
      body: parsed.data.note ?? undefined,
      link: "/orders",
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: `review.${parsed.data.decision.toLowerCase()}`,
      entityType: "Review",
      entityId: review.id,
      before: { status: review.status },
      after: { status: nextStatus },
    }),
  ]);

  return ok({ id: review.id, status: nextStatus });
}
