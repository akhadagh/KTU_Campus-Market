import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  marketplaceName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(120),
  supportEmail: z.string().trim().max(320),
  platformFeePercent: z.coerce.number().min(0).max(50),
  refundWindowDays: z.coerce.number().int().min(0).max(90),
  paymentWindowMinutes: z.coerce.number().int().min(5).max(240),
  maintenanceMode: z.boolean(),
  showDemoStores: z.boolean().optional(),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
    select: { key: true, valueJson: true, updatedAt: true },
  });
  return ok({ settings });
}

export async function PUT(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Check the setting values.", 422);
  }
  const values = parsed.data;

  const entries: [string, unknown][] = [
    ["marketplace.name", values.marketplaceName],
    ["marketplace.tagline", values.tagline],
    ["marketplace.supportEmail", values.supportEmail],
    ["marketplace.platformFeePercent", values.platformFeePercent],
    ["marketplace.refundWindowDays", values.refundWindowDays],
    ["marketplace.paymentWindowMinutes", values.paymentWindowMinutes],
    ["marketplace.maintenanceMode", values.maintenanceMode],
    ...(values.showDemoStores !== undefined
      ? [["marketplace.demoStoresVisible", values.showDemoStores] as [string, unknown]]
      : []),
  ];

  for (const [key, value] of entries) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, valueJson: value as object, updatedById: guard.auth.user.id },
      update: { valueJson: value as object, updatedById: guard.auth.user.id },
    });
  }

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "platform.settings_update",
    entityType: "PlatformSetting",
    entityId: "marketplace",
    after: Object.fromEntries(entries),
  });

  return ok({ updated: entries.length });
}
