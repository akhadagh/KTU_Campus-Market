import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action.slice(0, 96),
      entityType: input.entityType.slice(0, 64),
      entityId: input.entityId.slice(0, 64),
      beforeJson: input.before === undefined ? undefined : (input.before as object),
      afterJson: input.after === undefined ? undefined : (input.after as object),
      ipAddress: input.ipAddress?.slice(0, 64) ?? null,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    },
  });
}
