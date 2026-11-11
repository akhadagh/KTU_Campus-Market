import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: values.orderItemId },
    select: {
      id: true,
      productId: true,
      review: { select: { id: true } },
      vendorOrder: {
        select: {
          status: true,
          vendorId: true,
          order: { select: { buyerId: true, status: true } },
        },
      },
    },
  });
  if (!orderItem) return fail("NOT_FOUND", "That order item was not found.", 404);
  if (orderItem.vendorOrder.order.buyerId !== auth.user.id) {
    return fail("FORBIDDEN", "You can only review your own purchases.", 403);
  }
  if (orderItem.review) {
    return fail("CONFLICT", "You already reviewed this item.", 409);
  }
  if (orderItem.vendorOrder.status !== "DELIVERED") {
    return fail("CONFLICT", "You can review once the seller marks the order delivered.", 409);
  }

  const review = await prisma.review.create({
    data: {
      orderItemId: orderItem.id,
      productId: orderItem.productId,
      buyerId: auth.user.id,
      vendorId: orderItem.vendorOrder.vendorId,
      rating: values.rating,
      comment: values.comment || null,
      status: "PENDING",
      verifiedPurchase: true,
    },
    select: { id: true, status: true },
  });

  return ok({ review }, { status: 201 });
}
