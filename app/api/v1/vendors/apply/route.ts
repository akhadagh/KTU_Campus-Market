import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiVerified } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { vendorApplicationSchema } from "@/lib/validation";
import { availableVendorSlug } from "@/lib/vendors";
import { rateLimitWith } from "@/lib/rate-limit";

/**
 * Risk indicators for manual review. These never reject an application on their
 * own; they simply make the application visible to the review queue.
 */
async function collectRiskFlags(
  values: { registrationNumber?: string | undefined; documentUrl?: string | undefined },
  userId: string,
): Promise<string[]> {
  const flags: string[] = [];

  if (values.registrationNumber) {
    const duplicate = await prisma.vendorProfile.findFirst({
      where: {
        registrationNumber: values.registrationNumber,
        userId: { not: userId },
      },
      select: { id: true },
    });
    if (duplicate) flags.push("Registration number already used by another store");
  }

  if (values.documentUrl) {
    const reused = await prisma.vendorProfile.findFirst({
      where: { documentUrl: values.documentUrl, userId: { not: userId } },
      select: { id: true },
    });
    if (reused) flags.push("The same document was submitted by another applicant");
  }

  const previous = await prisma.vendorProfile.findFirst({
    where: { userId, verificationStatus: "REJECTED" },
    select: { id: true },
  });
  if (previous) flags.push("Previous application from this account was rejected");

  const recent = await prisma.vendorProfile.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent > 0) flags.push("More than one application in the last hour");

  return flags;
}

export async function POST(request: Request) {
  const guard = await requireApiVerified();
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
  const applyLimit = await rateLimitWith(`vendor-apply:${auth.user.id}`, 5, {
    windowMs: 60 * 60_000,
    failClosed: false,
  });
  if (!applyLimit.allowed) {
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

  const riskFlags = await collectRiskFlags(values, auth.user.id);

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
    sellerType: values.sellerType,
    businessAddress: values.businessAddress || null,
    registrationNumber: values.registrationNumber || null,
    documentUrl: values.documentUrl || null,
    documentType: values.documentType || null,
  };
  const vendor = canReapply
    ? await prisma.vendorProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          slug: await availableVendorSlug(values.storeName),
          riskFlagsJson: riskFlags.length > 0 ? riskFlags : undefined,
          verificationNote: null,
          verifiedAt: null,
          verifiedById: null,
        },
        select: { id: true, storeName: true, slug: true, status: true, createdAt: true },
      })
    : await prisma.vendorProfile.create({
        data: {
          ...data,
          userId: auth.user.id,
          slug: await availableVendorSlug(values.storeName),
          riskFlagsJson: riskFlags.length > 0 ? riskFlags : [],
        },
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
