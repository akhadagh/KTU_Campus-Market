import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
  priceDeltaCedis: z.coerce.number().min(-100000).max(100000).optional(),
  absolutePriceCedis: z.coerce.number().min(0).max(1000000).optional(),
  stock: z.coerce.number().int().min(0).max(1000000),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, vendor: { userId: guard.auth.user.id }, deletedAt: null },
    select: { id: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  const variants = await prisma.productVariant.findMany({
    where: { productId: product.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      priceDeltaPesewas: true,
      stock: true,
      isActive: true,
      attributesJson: true,
    },
  });

  return ok({ variants });
}

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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Give the variant a name and a stock quantity.", 422);
  }
  const values = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id, vendor: { userId: guard.auth.user.id }, deletedAt: null },
    select: { id: true, pricePesewas: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  const existingCount = await prisma.productVariant.count({ where: { productId: product.id } });
  if (existingCount >= 20) {
    return fail("CONFLICT", "A listing can have at most twenty variants.", 409);
  }

  const duplicate = await prisma.productVariant.findFirst({
    where: { productId: product.id, name: values.name },
    select: { id: true },
  });
  if (duplicate) {
    return fail("CONFLICT", "A variant with that name already exists.", 409);
  }

  const priceDeltaPesewas =
    values.absolutePriceCedis !== undefined
      ? Math.round((values.absolutePriceCedis - product.pricePesewas / 100) * 100)
      : Math.round((values.priceDeltaCedis ?? 0) * 100);

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: values.name,
      sku: values.sku || null,
      priceDeltaPesewas,
      stock: values.stock,
      isActive: true,
    },
    select: { id: true, name: true, sku: true, priceDeltaPesewas: true, stock: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "product.variant_create",
    entityType: "ProductVariant",
    entityId: variant.id,
    after: { productId: product.id, name: variant.name, stock: variant.stock },
  });

  return ok({ variant }, { status: 201 });
}
