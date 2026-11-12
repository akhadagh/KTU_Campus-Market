import { ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.USER_MANAGE);
  if (denied) return denied;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    50,
    Math.max(10, Number(url.searchParams.get("pageSize") ?? "20") || 20),
  );

  const where = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
        roles: { select: { role: { select: { name: true } } } },
        _count: { select: { orders: true } },
        vendorProfile: { select: { id: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return ok({
    users: users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles.map((entry) => entry.role.name),
      orderCount: user._count.orders,
      isVendor: user.vendorProfile !== null,
      vendorStatus: user.vendorProfile?.status ?? null,
    })),
    page,
    pageSize,
    total,
  });
}
