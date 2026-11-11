import { prisma } from "../lib/db";

const TEST_EMAIL_PARTS = [
  "verify.test.",
  "reset.test.",
  "vendor.",
  "buyer.",
  "smoke.",
  "lat1.",
  "lat2.",
  "lat3.",
  "lat4.",
  "stab1.",
  "stab2.",
  "stab3.",
  "admin.test@",
];

async function deleteOrders(orderIds: string[]) {
  if (orderIds.length === 0) return 0;
  await prisma.orderItem.deleteMany({ where: { vendorOrder: { orderId: { in: orderIds } } } });
  await prisma.inventoryReservation.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.vendorOrder.deleteMany({ where: { orderId: { in: orderIds } } });
  const result = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  return result.count;
}

async function main() {
  const removed = { users: 0, vendors: 0, products: 0, carts: 0, orders: 0, reviews: 0 };

  const testVendors = await prisma.vendorProfile.findMany({
    where: {
      OR: [
        { storeName: { in: ["KTU Test Gadgets", "Test Store", "Demo Store"] } },
        { user: { email: { contains: "vendor.", mode: "insensitive" as const } } },
      ],
    },
    select: { id: true, userId: true, storeName: true },
  });

  for (const vendor of testVendors) {
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: { vendorId: vendor.id },
      select: { orderId: true },
    });
    removed.orders += await deleteOrders([...new Set(vendorOrders.map((order) => order.orderId))]);
    await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.product.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.conversation.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.vendorProfile.delete({ where: { id: vendor.id } });
    removed.vendors += 1;
  }

  const testProducts = await prisma.product.findMany({
    where: { name: { startsWith: "Test " } },
    select: { id: true },
  });
  for (const product of testProducts) {
    await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    removed.products += 1;
  }

  const testUsers = await prisma.user.findMany({
    where: {
      OR: TEST_EMAIL_PARTS.map((part) => ({
        email: { contains: part, mode: "insensitive" as const },
      })),
    },
    select: { id: true, email: true },
  });
  const testUserIds = testUsers.map((user) => user.id);

  if (testUserIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { buyerId: { in: testUserIds } },
      select: { id: true },
    });
    removed.orders += await deleteOrders(orders.map((order) => order.id));

    await prisma.review.deleteMany({ where: { buyerId: { in: testUserIds } } });
    await prisma.message.deleteMany({ where: { senderId: { in: testUserIds } } });
    await prisma.conversation.deleteMany({ where: { buyerId: { in: testUserIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.cart.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.wishlist.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: testUserIds } } });
    removed.users += (await prisma.user.deleteMany({ where: { id: { in: testUserIds } } })).count;
  }

  const guestCarts = await prisma.cart.deleteMany({
    where: { userId: null, status: "ACTIVE" },
  });
  removed.carts = guestCarts.count;

  console.log("Cleanup complete:", JSON.stringify(removed));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
