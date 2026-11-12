import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { rateLimitWith } from "@/lib/rate-limit";

const schema = z.object({
  universityId: z.string().uuid("Choose your university"),
  campusId: z.string().uuid().optional(),
  institutionEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter your institutional email address")
    .max(320)
    .optional()
    .or(z.literal("")),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  const [verification, universities, campuses] = await Promise.all([
    prisma.studentVerification.findFirst({
      where: { userId: guard.auth.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        method: true,
        institutionEmail: true,
        status: true,
        notes: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
            university: { select: { id: true, name: true, code: true } },
            campus: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.university.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.campus.findMany({
      where: { isActive: true },
      select: { id: true, name: true, universityId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return ok({ verification, universities, campuses });
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Choose your university and enter your email.", 422);
  }
  const values = parsed.data;

  const limit = await rateLimitWith(`student-verification:${auth.user.id}`, 5, {
    windowMs: 60 * 60_000,
    failClosed: false,
  });
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many verification attempts. Try again later.", 429);
  }

  const university = await prisma.university.findUnique({
    where: { id: values.universityId },
    select: { id: true, name: true, code: true },
  });
  if (!university) return fail("VALIDATION_ERROR", "Choose a valid university.", 422);

  const existing = await prisma.studentVerification.findFirst({
    where: { userId: auth.user.id, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true, status: true },
  });
  if (existing?.status === "APPROVED") {
    return fail("CONFLICT", "Your student account is already verified.", 409);
  }
  if (existing?.status === "PENDING") {
    return fail("CONFLICT", "A verification request is already being reviewed.", 409);
  }

  // The institutional email is optional: students without one are reviewed
  // manually by an administrator. Only the address is stored — no identity
  // documents are uploaded to public storage.
  const verification = await prisma.studentVerification.create({
    data: {
      userId: auth.user.id,
      method: values.institutionEmail ? "INSTITUTION_EMAIL" : "OFFICIAL_DOCUMENT",
      institutionEmail: values.institutionEmail || null,
      status: "PENDING",
    },
    select: { id: true, status: true, method: true },
  });

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { universityId: university.id, campusId: values.campusId ?? auth.user.campusId },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    action: "student_verification.request",
    entityType: "StudentVerification",
    entityId: verification.id,
    after: {
      university: university.name,
      method: verification.method,
      institutionEmail: values.institutionEmail || null,
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      roles: { some: { role: { name: { in: ["admin", "moderator"] } } } },
    },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "SYSTEM",
        title: "Student verification request",
        body: `${auth.user.fullName} asked to be verified as a ${university.name} student.`,
        link: "/admin/students",
      }),
    ),
  );

  return ok({ verification }, { status: 201 });
}
