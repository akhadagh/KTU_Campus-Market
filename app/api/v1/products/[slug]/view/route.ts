import { fail, ok } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordProductView } from "@/lib/discovery";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  const session = await getSession();
  await recordProductView(product.id, session?.user.id ?? null);

  return ok({ recorded: true });
}
