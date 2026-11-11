import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const course = url.searchParams.get("course") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const query = url.searchParams.get("q")?.trim() ?? "";

  const materials = await prisma.learningMaterial.findMany({
    where: {
      status: "PUBLISHED",
      isFree: true,
      ...(category ? { category } : {}),
      ...(course ? { course } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { course: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      course: true,
      level: true,
      category: true,
      fileName: true,
      fileType: true,
      sizeBytes: true,
      downloadCount: true,
      publishedAt: true,
    },
  });

  return ok({ materials });
}
