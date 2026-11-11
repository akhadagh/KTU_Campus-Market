import { ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  const notifications = await prisma.notification.findMany({
    where: { userId: guard.auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });

  return ok({
    notifications,
    unreadCount: notifications.filter((notification) => notification.readAt === null).length,
  });
}

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const ids = (body as { ids?: unknown }).ids;
  const where =
    Array.isArray(ids) && ids.length > 0
      ? { userId: guard.auth.user.id, id: { in: ids as string[] } }
      : { userId: guard.auth.user.id };

  const result = await prisma.notification.updateMany({
    where: { ...where, readAt: null },
    data: { readAt: new Date() },
  });

  return ok({ marked: result.count });
}
