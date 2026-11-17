import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";

/** Published announcements for the storefront. */
export async function GET() {
  const announcements = await prisma.announcement.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { id: true, title: true, body: true, audience: true, publishedAt: true },
  });
  return ok({ announcements });
}
