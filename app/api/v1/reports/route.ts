import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";
import { rateLimitWith } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validation";

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
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;

  const reportLimit = await rateLimitWith(`report:${auth.user.id}`, 20, {
    windowMs: 60 * 60_000,
    failClosed: false,
  });
  if (!reportLimit.allowed) {
    return fail("RATE_LIMITED", "Too many reports submitted. Try again later.", 429);
  }

  const targetExists = await prisma.report.findFirst({
    where: {
      reporterId: auth.user.id,
      targetType: values.targetType,
      targetId: values.targetId,
      status: { in: ["OPEN", "IN_REVIEW"] },
    },
    select: { id: true },
  });
  if (targetExists) {
    return fail("CONFLICT", "You already reported this. Our team is reviewing it.", 409);
  }

  const report = await prisma.report.create({
    data: {
      reporterId: auth.user.id,
      targetType: values.targetType,
      targetId: values.targetId,
      reason: values.reason,
      details: values.description,
      status: "OPEN",
    },
    select: { id: true, status: true },
  });

  return ok({ report }, { status: 201 });
}
