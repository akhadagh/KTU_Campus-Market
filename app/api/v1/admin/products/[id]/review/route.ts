import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "DELIST"]),
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
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Choose a valid decision.", 422);
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      vendor: { select: { id: true, storeName: true, userId: true } },
    },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  if (parsed.data.decision === "APPROVE") {
    if (!["PENDING_REVIEW", "REJECTED", "DRAFT", "OUT_OF_STOCK"].includes(product.status)) {
      return fail("CONFLICT", `Cannot approve a product with status ${product.status}.`, 409);
    }
    await prisma.product.update({
      where: { id },
      data: {
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });
  } else if (parsed.data.decision === "REJECT") {
    if (product.status !== "PENDING_REVIEW") {
      return fail("CONFLICT", "Only products pending review can be rejected.", 409);
    }
    await prisma.product.update({ where: { id }, data: { status: "REJECTED" } });
  } else {
    if (product.status !== "ACTIVE") {
      return fail("CONFLICT", "Only active products can be delisted.", 409);
    }
    await prisma.product.update({ where: { id }, data: { status: "REJECTED" } });
  }

  const nextStatus =
    parsed.data.decision === "APPROVE"
      ? "ACTIVE"
      : parsed.data.decision === "REJECT"
        ? "REJECTED"
        : "REJECTED";
  const notification =
    parsed.data.decision === "APPROVE"
      ? {
          title: "Product approved",
          body: `${product.name} is now live in the marketplace.`,
        }
      : {
          title: parsed.data.decision === "DELIST" ? "Product delisted" : "Product not approved",
          body: parsed.data.note ?? `${product.name} was not published. Edit it and resubmit.`,
        };

  await Promise.all([
    createNotification({
      userId: product.vendor.userId,
      type: "SYSTEM",
      title: notification.title,
      body: notification.body,
      link: "/sell/products",
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: `product.${parsed.data.decision.toLowerCase()}`,
      entityType: "Product",
      entityId: product.id,
      before: { status: product.status },
      after: { status: nextStatus, note: parsed.data.note ?? null },
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    }),
  ]);

  return ok({ id: product.id, status: nextStatus });
}
