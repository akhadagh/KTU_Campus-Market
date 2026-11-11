import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const allowedStatuses = ["PENDING", "ACTIVE", "PAUSED", "SUSPENDED", "CLOSED"] as const;
type VendorStatus = (typeof allowedStatuses)[number];

export async function GET(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.VENDOR_APPROVE);
  if (denied) return denied;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "PENDING";
  if (!allowedStatuses.includes(statusParam as VendorStatus)) {
    return fail("VALIDATION_ERROR", "Unknown vendor status filter.", 422);
  }
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20),
  );
  const where = { status: statusParam as VendorStatus };

  const [vendors, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        storeName: true,
        slug: true,
        description: true,
        businessCategory: true,
        phone: true,
        whatsapp: true,
        status: true,
        verificationStatus: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true, emailVerifiedAt: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  return ok({ vendors, page, pageSize, total });
}
