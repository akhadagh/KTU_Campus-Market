import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { ProductCondition, CategoryType } from "../lib/generated/prisma/client";

const SAMPLE_PASSWORD = process.env["SEED_SAMPLE_PASSWORD"] ?? "CampusSample!2026";

const sampleCategories: { slug: string; name: string; type: CategoryType }[] = [
  { slug: "electronics", name: "Electronics & Gadgets", type: CategoryType.PRODUCT },
  { slug: "fashion", name: "Fashion & Clothing", type: CategoryType.PRODUCT },
  { slug: "books-academics", name: "Books & Academics", type: CategoryType.PRODUCT },
  { slug: "food-groceries", name: "Food & Groceries", type: CategoryType.PRODUCT },
  { slug: "beauty-care", name: "Beauty & Personal Care", type: CategoryType.PRODUCT },
  { slug: "hostel-essentials", name: "Hostel & Room Essentials", type: CategoryType.PRODUCT },
  { slug: "sports-fitness", name: "Sports & Fitness", type: CategoryType.PRODUCT },
  { slug: "services", name: "Services", type: CategoryType.SERVICE },
  { slug: "accommodation", name: "Accommodation & Rentals", type: CategoryType.SERVICE },
  { slug: "other", name: "Other Products", type: CategoryType.PRODUCT },
];

const roles = [
  { name: "admin", description: "Platform administrator" },
  { name: "moderator", description: "Content and trust moderator" },
  { name: "vendor", description: "Campus seller" },
  { name: "buyer", description: "Campus shopper" },
] as const;

const permissions = [
  { code: "product.create", description: "Create products" },
  { code: "product.edit", description: "Edit own products" },
  { code: "product.moderate", description: "Approve or reject products" },
  { code: "order.manage", description: "Manage orders" },
  { code: "vendor.approve", description: "Approve vendor applications" },
  { code: "user.manage", description: "Manage user accounts" },
  { code: "report.review", description: "Review reports and disputes" },
  { code: "settings.manage", description: "Manage platform settings" },
] as const;

const rolePermissions: Record<string, string[]> = {
  admin: permissions.map((permission) => permission.code),
  moderator: ["product.moderate", "report.review"],
  vendor: ["product.create", "product.edit", "order.manage"],
  buyer: [],
};

const conditionMap: Record<string, ProductCondition> = {
  New: ProductCondition.NEW,
  Used: ProductCondition.USED_GOOD,
  Refurbished: ProductCondition.REFURBISHED,
};

const sampleVendors = [
  {
    storeName: "Sample Tech Store",
    slug: "sample-tech-store",
    email: "sample-tech-store@example.com",
    description: "Sample vendor: laptops and gadgets. Demonstration data only.",
  },
  {
    storeName: "Campus Mobile Hub",
    slug: "campus-mobile-hub",
    email: "campus-mobile-hub@example.com",
    description: "Sample vendor: phones and accessories. Demonstration data only.",
  },
  {
    storeName: "Sample Book Corner",
    slug: "sample-book-corner",
    email: "sample-book-corner@example.com",
    description: "Sample vendor: textbooks and study materials. Demonstration data only.",
  },
  {
    storeName: "Sample Gadget Shop",
    slug: "sample-gadget-shop",
    email: "sample-gadget-shop@example.com",
    description: "Sample vendor: audio gadgets. Demonstration data only.",
  },
  {
    storeName: "Sample Hostel Essentials",
    slug: "sample-hostel-essentials",
    email: "sample-hostel-essentials@example.com",
    description: "Sample vendor: hostel room items. Demonstration data only.",
  },
  {
    storeName: "Sample Creative Studio",
    slug: "sample-creative-studio",
    email: "sample-creative-studio@example.com",
    description: "Sample vendor: design services. Demonstration data only.",
  },
  {
    storeName: "Sample Print Hub",
    slug: "sample-print-hub",
    email: "sample-print-hub@example.com",
    description: "Sample vendor: printing and binding. Demonstration data only.",
  },
] as const;

const sampleProducts: {
  slug: string;
  name: string;
  description: string;
  pricePesewas: number;
  originalPricePesewas?: number;
  condition: string;
  categorySlug: string;
  vendorSlug: string;
  quantity: number;
  tags: string[];
}[] = [
  {
    slug: "hp-elitebook-840-g5",
    name: "HP EliteBook 840 G5",
    description:
      "Sample listing: 8GB RAM, 256GB SSD, Intel Core i5, good battery. Suitable for programming and assignments. This is demonstration data, not a real vendor listing.",
    pricePesewas: 285000,
    originalPricePesewas: 320000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "sample-tech-store",
    quantity: 2,
    tags: ["laptop", "hp", "used"],
  },
  {
    slug: "dell-latitude-7490",
    name: "Dell Latitude 7490",
    description:
      "Sample listing: 16GB RAM, 512GB SSD, lightweight business laptop. Demonstration data only.",
    pricePesewas: 340000,
    condition: "Refurbished",
    categorySlug: "electronics",
    vendorSlug: "sample-tech-store",
    quantity: 1,
    tags: ["laptop", "dell"],
  },
  {
    slug: "samsung-galaxy-a54",
    name: "Samsung Galaxy A54",
    description:
      "Sample listing: 128GB storage, dual SIM, excellent camera. Demonstration data only.",
    pricePesewas: 145000,
    originalPricePesewas: 160000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "campus-mobile-hub",
    quantity: 3,
    tags: ["phone", "samsung"],
  },
  {
    slug: "engineering-mathematics-textbook",
    name: "Engineering Mathematics Textbook",
    description: "Sample listing: second-hand textbook in good condition. Demonstration data only.",
    pricePesewas: 6500,
    condition: "Used",
    categorySlug: "books-academics",
    vendorSlug: "sample-book-corner",
    quantity: 4,
    tags: ["textbook", "mathematics"],
  },
  {
    slug: "wireless-headphones",
    name: "Wireless Over-Ear Headphones",
    description:
      "Sample listing: Bluetooth headphones with noise isolation and long battery life. Demonstration data only.",
    pricePesewas: 18000,
    originalPricePesewas: 22000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "sample-gadget-shop",
    quantity: 5,
    tags: ["audio", "bluetooth"],
  },
  {
    slug: "hostel-desk-fan",
    name: "Rechargeable Desk Fan",
    description:
      "Sample listing: quiet rechargeable fan suitable for hostel rooms. Demonstration data only.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "sample-hostel-essentials",
    quantity: 6,
    tags: ["hostel", "fan"],
  },
  {
    slug: "graphic-design-service",
    name: "Graphic Design Service",
    description:
      "Sample service: flyers, posters, and social media designs. Demonstration data only.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "sample-creative-studio",
    quantity: 99,
    tags: ["design", "service"],
  },
  {
    slug: "campus-printing-service",
    name: "Campus Printing & Binding",
    description:
      "Sample service: printing, binding, and project cover design. Demonstration data only.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "sample-print-hub",
    quantity: 99,
    tags: ["printing", "service"],
  },
];

async function main() {
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Seeding is disabled in production.");
  }

  try {
    const passwordHash = await hashPassword(SAMPLE_PASSWORD);

    const university = await prisma.university.upsert({
      where: { code: "KTU" },
      update: {},
      create: {
        name: "Kumasi Technical University",
        code: "KTU",
        country: "Ghana",
        status: "ACTIVE",
      },
    });

    let campus = await prisma.campus.findFirst({
      where: { universityId: university.id, name: "KTU Main Campus" },
    });
    if (!campus) {
      campus = await prisma.campus.create({
        data: {
          universityId: university.id,
          name: "KTU Main Campus",
          address: "Adum, Kumasi",
          city: "Kumasi",
          region: "Ashanti",
          isActive: true,
        },
      });
    }

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: { name: role.name, description: role.description },
      });
    }

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: { description: permission.description },
        create: { code: permission.code, description: permission.description },
      });
    }

    for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
      const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
      for (const code of permissionCodes) {
        const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        });
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          });
        }
      }
    }

    for (const category of sampleCategories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, type: category.type, isActive: true },
        create: { name: category.name, slug: category.slug, type: category.type, isActive: true },
      });
    }

    const pickupNames = [
      { name: "Main Campus Gate", address: "Main gate, Adum campus" },
      { name: "Library Forecourt", address: "Beside the main library" },
    ];
    for (const pickup of pickupNames) {
      const existing = await prisma.pickupLocation.findFirst({
        where: { campusId: campus.id, name: pickup.name },
      });
      if (!existing) {
        await prisma.pickupLocation.create({
          data: { campusId: campus.id, name: pickup.name, address: pickup.address, isActive: true },
        });
      }
    }

    let vendorCount = 0;
    for (const vendor of sampleVendors) {
      const user = await prisma.user.upsert({
        where: { email: vendor.email },
        update: { status: "ACTIVE", emailVerifiedAt: new Date() },
        create: {
          email: vendor.email,
          passwordHash,
          fullName: vendor.storeName,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
          universityId: university.id,
          campusId: campus.id,
          personalizationOptOut: true,
        },
      });

      const existingProfile = await prisma.vendorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await prisma.vendorProfile.create({
          data: {
            userId: user.id,
            storeName: vendor.storeName,
            slug: vendor.slug,
            description: vendor.description,
            campusId: campus.id,
            verificationStatus: "VERIFIED",
            status: "ACTIVE",
            pickupAvailable: true,
            deliveryAvailable: false,
          },
        });
        vendorCount += 1;
      }
    }

    let productCount = 0;
    for (const product of sampleProducts) {
      const vendor = await prisma.vendorProfile.findUniqueOrThrow({
        where: { slug: product.vendorSlug },
      });
      const category = await prisma.category.findUniqueOrThrow({
        where: { slug: product.categorySlug },
      });

      const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
      if (!existing) {
        await prisma.product.create({
          data: {
            vendorId: vendor.id,
            categoryId: category.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            pricePesewas: product.pricePesewas,
            originalPricePesewas: product.originalPricePesewas,
            condition: conditionMap[product.condition] ?? ProductCondition.NOT_SPECIFIED,
            quantity: product.quantity,
            status: "ACTIVE",
            campusId: campus.id,
            deliveryOptions: product.categorySlug === "services" ? [] : ["PICKUP"],
            pickupAvailable: product.categorySlug !== "services",
            tags: product.tags,
            publishedAt: new Date(),
          },
        });
        productCount += 1;
      }
    }

    console.log(
      `Seed complete: 1 university, 1 campus, ${roles.length} roles, ${permissions.length} permissions, ${sampleCategories.length} categories, ${sampleVendors.length} sample vendors (${vendorCount} new), ${sampleProducts.length} sample products (${productCount} new), ${pickupNames.length} pickup locations.`,
    );
    console.log("All vendors and products above are SAMPLE DATA for development only.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  if (
    /ECONNREFUSED|ENOTFOUND|getaddrinfo|Connect request failed|Can't reach database/i.test(message)
  ) {
    console.error(
      "PostgreSQL is not reachable. Start a database and set DATABASE_URL in .env, then run: pnpm db:deploy && pnpm db:seed",
    );
  }
  process.exitCode = 1;
});
