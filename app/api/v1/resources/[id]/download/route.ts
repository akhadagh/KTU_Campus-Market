import { fail } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await prisma.learningMaterial.findFirst({
    where: { id, status: "PUBLISHED", isFree: true },
    select: { id: true, fileUrl: true },
  });
  if (!material) return fail("NOT_FOUND", "That material is no longer available.", 404);

  await prisma.learningMaterial.update({
    where: { id: material.id },
    data: { downloadCount: { increment: 1 } },
  });

  return Response.redirect(material.fileUrl, 302);
}
