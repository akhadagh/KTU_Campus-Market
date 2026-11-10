import { prisma } from "../lib/db";

async function main() {
  const [universities, campuses, roles, categories, vendors, products, users] = await Promise.all([
    prisma.university.count(),
    prisma.campus.count(),
    prisma.role.count(),
    prisma.category.count(),
    prisma.vendorProfile.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  const sampleProduct = await prisma.product.findFirst({
    where: { slug: "hp-elitebook-840-g5" },
    select: {
      name: true,
      pricePesewas: true,
      status: true,
      vendor: { select: { storeName: true } },
    },
  });

  if (!sampleProduct) {
    throw new Error("Sample product missing — seed did not run.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        databaseUrlHost: new URL(process.env["DATABASE_URL"] ?? "").host,
        counts: { universities, campuses, roles, categories, vendors, products, users },
        sampleProduct,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`verify-db failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
