import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  recipientName: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(9).max(32).optional(),
  address: z.string().trim().min(5).max(300).optional(),
  campus: z.string().trim().max(120).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Check the address details.", 422);
  const values = parsed.data;

  const existing = await prisma.address.findFirst({
    where: { id, userId: guard.auth.user.id },
    select: { id: true },
  });
  if (!existing) return fail("NOT_FOUND", "Address not found.", 404);

  const updated = await prisma.$transaction(async (tx) => {
    if (values.isDefault) {
      await tx.address.updateMany({
        where: { userId: guard.auth.user.id },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        ...(values.label !== undefined ? { label: values.label } : {}),
        ...(values.recipientName !== undefined ? { recipientName: values.recipientName } : {}),
        ...(values.phone !== undefined ? { phone: values.phone } : {}),
        ...(values.address !== undefined ? { address: values.address } : {}),
        ...(values.campus !== undefined ? { campus: values.campus || null } : {}),
        ...(values.instructions !== undefined ? { instructions: values.instructions || null } : {}),
        ...(values.isDefault !== undefined ? { isDefault: values.isDefault } : {}),
      },
      select: { id: true, label: true, isDefault: true },
    });
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "address.update",
    entityType: "Address",
    entityId: id,
    after: values,
  });

  return ok({ address: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: guard.auth.user.id },
    select: { id: true },
  });
  if (!existing) return fail("NOT_FOUND", "Address not found.", 404);

  await prisma.address.delete({ where: { id } });
  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "address.delete",
    entityType: "Address",
    entityId: id,
  });

  return ok({ removed: true });
}
