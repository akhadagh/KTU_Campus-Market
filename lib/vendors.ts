import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function availableVendorSlug(storeName: string): Promise<string> {
  const base = slugify(storeName) || "store";
  let candidate = base;
  let attempt = 1;
  while (
    await prisma.vendorProfile.findUnique({ where: { slug: candidate }, select: { id: true } })
  ) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function availableProductSlug(name: string): Promise<string> {
  const base = slugify(name) || "product";
  let candidate = base;
  let attempt = 1;
  while (await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function grantVendorRole(userId: string, grantedBy?: string | null): Promise<void> {
  const role = await prisma.role.findUnique({ where: { name: "vendor" }, select: { id: true } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id, grantedBy: grantedBy ?? null },
    update: {},
  });
}

export async function revokeVendorRole(userId: string): Promise<void> {
  const role = await prisma.role.findUnique({ where: { name: "vendor" }, select: { id: true } });
  if (!role) return;
  await prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
}
