import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { vendorApplicationSchema } from "@/lib/validation";
import { availableVendorSlug } from "@/lib/vendors";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true, status: true, verificationStatus: true },
  });
  const canReapply = existing?.status === "CLOSED" && existing.verificationStatus === "REJECTED";
  if (existing && !canReapply) {
    return fail("CONFLICT", "You already have a vendor store.", 409);
  }
  if (!rateLimit(`vendor-apply:${auth.user.id}`, 5, 60 * 60_000)) {
    return fail("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = vendorApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;

  const data = {
    storeName: values.storeName,
    description: values.description,
    businessCategory: values.businessCategory || null,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    pickupAvailable: values.pickupAvailable,
    deliveryAvailable: values.deliveryAvailable,
    campusId: auth.user.campusId,
    status: "PENDING" as const,
    verificationStatus: "PENDING" as const,
  };
  const vendor = canReapply
    ? await prisma.vendorProfile.update({
        where: { id: existing.id },
        data: { ...data, slug: await availableVendorSlug(values.storeName) },
        select: { id: true, storeName: true, slug: true, status: true, createdAt: true },
      })
    : await prisma.vendorProfile.create({
        data: { ...data, userId: auth.user.id, slug: await availableVendorSlug(values.storeName) },
        select: { id: true, storeName: true, slug: true, status: true, createdAt: true },
      });

  await Promise.all([
    writeAuditLog({
      actorId: auth.user.id,
      action: "vendor.apply",
      entityType: "VendorProfile",
      entityId: vendor.id,
      after: { status: "PENDING", storeName: vendor.storeName },
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    }),
    createNotification({
      userId: auth.user.id,
      type: "SYSTEM",
      title: "Vendor application received",
      body: "An administrator will review your store application.",
      link: "/sell/pending",
    }),
  ]);

  return ok({ vendor }, { status: 201 });
}
