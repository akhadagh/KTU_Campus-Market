import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const allowedStatuses = [
  "DRAFT",
  "PENDING_REVIEW",
  "ACTIVE",
  "REJECTED",
  "OUT_OF_STOCK",
  "ARCHIVED",
] as const;
type ProductStatus = (typeof allowedStatuses)[number];

export async function GET(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_MODERATE);
  if (denied) return denied;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "PENDING_REVIEW";
  if (!allowedStatuses.includes(statusParam as ProductStatus)) {
    return fail("VALIDATION_ERROR", "Unknown product status filter.", 422);
  }
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20),
  );
  const where = { status: statusParam as ProductStatus, deletedAt: null };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pricePesewas: true,
        quantity: true,
        status: true,
        updatedAt: true,
        category: { select: { name: true } },
        vendor: { select: { id: true, storeName: true, slug: true, status: true } },
        images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return ok({ products, page, pageSize, total });
}
