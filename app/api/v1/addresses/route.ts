import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const addressSchema = z.object({
  label: z.string().trim().min(2).max(60),
  recipientName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(9).max(32),
  address: z.string().trim().min(5).max(300),
  campus: z.string().trim().max(120).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  const addresses = await prisma.address.findMany({
    where: { userId: guard.auth.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      recipientName: true,
      phone: true,
      address: true,
      campus: true,
      instructions: true,
      isDefault: true,
      createdAt: true,
    },
  });

  return ok({ addresses });
}

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
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Check the address details.", 422);
  }
  const values = parsed.data;

  const existingCount = await prisma.address.count({ where: { userId: auth.user.id } });
  if (existingCount >= 10) {
    return fail("CONFLICT", "You can save up to ten addresses.", 409);
  }

  const address = await prisma.$transaction(async (tx) => {
    if (values.isDefault) {
      await tx.address.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: auth.user.id,
        label: values.label,
        recipientName: values.recipientName,
        phone: values.phone,
        address: values.address,
        campus: values.campus || null,
        instructions: values.instructions || null,
        isDefault: values.isDefault || existingCount === 0,
      },
      select: { id: true, label: true, isDefault: true },
    });
  });

  await writeAuditLog({
    actorId: auth.user.id,
    action: "address.create",
    entityType: "Address",
    entityId: address.id,
    after: { label: address.label },
  });

  return ok({ address }, { status: 201 });
}
