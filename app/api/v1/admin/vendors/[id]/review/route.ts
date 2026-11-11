import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { grantVendorRole, revokeVendorRole } from "@/lib/vendors";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "SUSPEND", "REACTIVATE", "PAUSE"]),
  note: z.string().trim().max(1000).optional(),
});

const allowed: Record<string, string[]> = {
  APPROVE: ["PENDING", "CLOSED"],
  REJECT: ["PENDING"],
  SUSPEND: ["ACTIVE", "PAUSED"],
  REACTIVATE: ["SUSPENDED", "PAUSED"],
  PAUSE: ["ACTIVE"],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.VENDOR_APPROVE);
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

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, verificationStatus: true, storeName: true },
  });
  if (!vendor) return fail("NOT_FOUND", "Vendor not found.", 404);
  if (!allowed[parsed.data.decision]?.includes(vendor.status)) {
    return fail(
      "CONFLICT",
      `Cannot ${parsed.data.decision.toLowerCase()} a vendor with status ${vendor.status}.`,
      409,
    );
  }

  const next =
    parsed.data.decision === "APPROVE"
      ? { status: "ACTIVE" as const, verificationStatus: "VERIFIED" as const }
      : parsed.data.decision === "REJECT"
        ? { status: "CLOSED" as const, verificationStatus: "REJECTED" as const }
        : parsed.data.decision === "SUSPEND"
          ? { status: "SUSPENDED" as const, verificationStatus: "SUSPENDED" as const }
          : parsed.data.decision === "PAUSE"
            ? { status: "PAUSED" as const, verificationStatus: vendor.verificationStatus }
            : { status: "ACTIVE" as const, verificationStatus: "VERIFIED" as const };

  await prisma.vendorProfile.update({ where: { id }, data: next });

  if (parsed.data.decision === "APPROVE" || parsed.data.decision === "REACTIVATE") {
    await grantVendorRole(vendor.userId, guard.auth.user.id);
  }
  if (parsed.data.decision === "REJECT" || parsed.data.decision === "SUSPEND") {
    await revokeVendorRole(vendor.userId);
  }

  const messages: Record<string, { title: string; body: string; link: string }> = {
    APPROVE: {
      title: "Your store is live",
      body: `${vendor.storeName} was approved. You can start publishing products.`,
      link: "/sell/dashboard",
    },
    REJECT: {
      title: "Vendor application not approved",
      body: parsed.data.note ?? "You can update your details and apply again.",
      link: "/sell/apply",
    },
    SUSPEND: {
      title: "Store suspended",
      body: parsed.data.note ?? "Contact support for details.",
      link: "/sell/pending",
    },
    REACTIVATE: {
      title: "Store reactivated",
      body: `${vendor.storeName} is active again.`,
      link: "/sell/dashboard",
    },
    PAUSE: {
      title: "Store paused",
      body: parsed.data.note ?? "Your store is temporarily paused.",
      link: "/sell/pending",
    },
  };
  const message = messages[parsed.data.decision];

  await Promise.all([
    createNotification({
      userId: vendor.userId,
      type: "SYSTEM",
      title: message.title,
      body: message.body,
      link: message.link,
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: `vendor.${parsed.data.decision.toLowerCase()}`,
      entityType: "VendorProfile",
      entityId: vendor.id,
      before: { status: vendor.status, verificationStatus: vendor.verificationStatus },
      after: { ...next, note: parsed.data.note ?? null },
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    }),
  ]);

  return ok({ id: vendor.id, ...next });
}
