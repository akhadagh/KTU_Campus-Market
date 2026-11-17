import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({ reply: z.string().trim().min(2).max(1000) });

/** A seller responds to a published review on their own listing. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Write a short reply.", 422);

  const review = await prisma.review.findFirst({
    where: { id, vendorId: guard.auth.vendorId ?? "" },
    select: { id: true, status: true },
  });
  if (!review) return fail("NOT_FOUND", "Review not found.", 404);
  if (review.status !== "PUBLISHED") {
    return fail("CONFLICT", "You can only reply to a published review.", 409);
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { vendorReply: parsed.data.reply },
    select: { id: true, vendorReply: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "review.reply",
    entityType: "Review",
    entityId: review.id,
    after: { reply: parsed.data.reply },
  });

  return ok({ review: updated });
}
