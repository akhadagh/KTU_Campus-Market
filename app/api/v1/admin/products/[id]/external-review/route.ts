import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
});

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

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      purchaseMode: true,
      externalUrl: true,
      externalStatus: true,
      vendor: { select: { userId: true, storeName: true } },
    },
  });
  if (!product) return fail("NOT_FOUND", "Listing not found.", 404);
  if (product.purchaseMode !== "EXTERNAL") {
    return fail("CONFLICT", "This listing is not an external vendor link.", 409);
  }
  if (!product.externalUrl) {
    return fail("CONFLICT", "The vendor has not added a purchase link yet.", 409);
  }

  const nextStatus = parsed.data.decision === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.product.update({
    where: { id },
    data: {
      externalStatus: nextStatus,
      externalReviewedById: guard.auth.user.id,
      externalReviewedAt: new Date(),
      externalNote: parsed.data.note ?? null,
    },
  });

  await Promise.all([
    createNotification({
      userId: product.vendor.userId,
      type: "SYSTEM",
      title:
        nextStatus === "APPROVED"
          ? "Your purchase link is approved"
          : "Your purchase link was not approved",
      body:
        parsed.data.note ??
        (nextStatus === "APPROVED"
          ? `${product.name} is now visible to students.`
          : "Check the link and try again."),
      link: "/sell/products",
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: `external-link.${parsed.data.decision.toLowerCase()}`,
      entityType: "Product",
      entityId: product.id,
      before: { externalStatus: product.externalStatus },
      after: { externalStatus: nextStatus, note: parsed.data.note ?? null },
    }),
  ]);

  return ok({ id: product.id, externalStatus: nextStatus });
}
