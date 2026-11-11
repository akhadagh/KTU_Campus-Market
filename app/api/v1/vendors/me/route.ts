import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { vendorApplicationSchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: guard.auth.user.id },
    select: {
      id: true,
      storeName: true,
      slug: true,
      description: true,
      logoUrl: true,
      businessCategory: true,
      phone: true,
      whatsapp: true,
      pickupAvailable: true,
      deliveryAvailable: true,
      status: true,
      verificationStatus: true,
      ratingAvg: true,
      ratingCount: true,
      createdAt: true,
    },
  });
  if (!vendor) return fail("NOT_FOUND", "You do not have a vendor store yet.", 404);
  return ok({ vendor });
}

export async function PATCH(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  if (!guard.auth.vendorId) {
    return fail("NOT_FOUND", "You do not have a vendor store yet.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = vendorApplicationSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return fail("VALIDATION_ERROR", "Nothing to update.", 422);
  }

  const before = await prisma.vendorProfile.findUniqueOrThrow({
    where: { id: guard.auth.vendorId },
    select: { storeName: true, description: true, phone: true, whatsapp: true },
  });
  const data = parsed.data;
  const vendor = await prisma.vendorProfile.update({
    where: { id: guard.auth.vendorId },
    data: {
      ...(data.storeName !== undefined ? { storeName: data.storeName } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.businessCategory !== undefined
        ? { businessCategory: data.businessCategory || null }
        : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp || null } : {}),
      ...(data.pickupAvailable !== undefined ? { pickupAvailable: data.pickupAvailable } : {}),
      ...(data.deliveryAvailable !== undefined
        ? { deliveryAvailable: data.deliveryAvailable }
        : {}),
    },
    select: { id: true, storeName: true, slug: true, description: true, status: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "vendor.update",
    entityType: "VendorProfile",
    entityId: vendor.id,
    before,
    after: data,
  });

  return ok({ vendor });
}
