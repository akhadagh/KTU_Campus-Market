import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { getCartSummary, getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { DELIVERY_FEES_PESEWAS, RESERVATION_MINUTES, generateOrderNumber } from "@/lib/orders";
import { checkoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;

  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: values.idempotencyKey },
    select: { id: true, orderNumber: true, status: true, totalPesewas: true },
  });
  if (existing) return ok({ order: existing, reused: true });

  const cart = await getOrCreateCart();
  const summary = await getCartSummary(cart.id);
  if (summary.items.length === 0) {
    return fail("VALIDATION_ERROR", "Your cart is empty.", 422);
  }

  const digitalLines = summary.items.filter((item) => item.isDigital);
  const allDigital = digitalLines.length === summary.items.length;
  if (digitalLines.length > 0 && !values.msisdn) {
    return fail("VALIDATION_ERROR", "Enter the phone number for the digital delivery.", 422, {
      msisdn: "Enter the phone number for the digital delivery",
    });
  }
  const deliveryMethod = allDigital ? "DIGITAL" : values.deliveryMethod;

  if (deliveryMethod !== "PICKUP" && deliveryMethod !== "DIGITAL" && !values.deliveryAddress) {
    return fail("VALIDATION_ERROR", "Enter a delivery address.", 422, {
      deliveryAddress: "Enter a delivery address",
    });
  }
  if (deliveryMethod === "PICKUP" && !values.pickupLocationId) {
    return fail("VALIDATION_ERROR", "Choose a pickup point.", 422, {
      pickupLocationId: "Choose a pickup point",
    });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: summary.items.map((item) => item.productId) } },
    select: {
      id: true,
      name: true,
      pricePesewas: true,
      quantity: true,
      vendorId: true,
      status: true,
      slug: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  for (const line of summary.items) {
    const product = productById.get(line.productId);
    if (!product || product.status !== "ACTIVE") {
      return fail("CONFLICT", `${line.productName} is no longer available.`, 409);
    }
    if (line.quantity > product.quantity) {
      return fail(
        "CONFLICT",
        `Only ${product.quantity} of ${line.productName} left in stock.`,
        409,
      );
    }
  }

  const byVendor = new Map<string, typeof summary.items>();
  for (const line of summary.items) {
    byVendor.set(line.vendorId, [...(byVendor.get(line.vendorId) ?? []), line]);
  }

  const deliveryFee = DELIVERY_FEES_PESEWAS[deliveryMethod];
  const vendorOrders = [...byVendor.entries()].map(([vendorId, lines]) => {
    const subtotal = lines.reduce((total, line) => total + line.lineTotalPesewas, 0);
    return {
      vendorId,
      lines,
      subtotal,
      total: subtotal + deliveryFee,
    };
  });
  const subtotalTotal = vendorOrders.reduce((total, entry) => total + entry.subtotal, 0);
  const deliveryTotal = deliveryFee * vendorOrders.length;
  const total = subtotalTotal + deliveryTotal;

  const reservationExpiry = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
  const vendorOwners = await prisma.vendorProfile.findMany({
    where: { id: { in: [...byVendor.keys()] } },
    select: { id: true, userId: true },
  });
  const ownerByVendor = new Map(vendorOwners.map((vendor) => [vendor.id, vendor.userId]));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId: auth.user.id,
        status: "PENDING_PAYMENT",
        subtotalPesewas: subtotalTotal,
        deliveryTotalPesewas: deliveryTotal,
        totalPesewas: total,
        deliveryMethod,
        deliveryAddressJson: values.deliveryAddress ?? undefined,
        notes: values.notes ?? null,
        idempotencyKey: values.idempotencyKey,
        campusId: auth.user.campusId,
        statusHistory: {
          create: {
            toStatus: "PENDING_PAYMENT",
            actorId: auth.user.id,
            actorType: "BUYER",
            reason: "Order placed",
          },
        },
      },
      select: { id: true, orderNumber: true, totalPesewas: true },
    });

    for (const entry of vendorOrders) {
      const vendorOrder = await tx.vendorOrder.create({
        data: {
          orderId: created.id,
          vendorId: entry.vendorId,
          status: "PENDING",
          subtotalPesewas: entry.subtotal,
          deliveryFeePesewas: deliveryFee,
          totalPesewas: entry.total,
          fulfillmentType:
            deliveryMethod === "PICKUP"
              ? "PICKUP"
              : deliveryMethod === "DIGITAL"
                ? "DIGITAL"
                : "DELIVERY",
          pickupLocationId: deliveryMethod === "PICKUP" ? (values.pickupLocationId ?? null) : null,
          ...(deliveryMethod === "DIGITAL" && values.msisdn
            ? { notes: `Credit to ${values.msisdn}` }
            : {}),
          statusHistory: {
            create: {
              orderId: created.id,
              toStatus: "PENDING",
              actorId: auth.user.id,
              actorType: "BUYER",
              reason: "Order placed",
            },
          },
        },
        select: { id: true, vendorId: true },
      });

      for (const line of entry.lines) {
        const product = productById.get(line.productId)!;
        await tx.orderItem.create({
          data: {
            vendorOrderId: vendorOrder.id,
            productId: product.id,
            titleSnapshot: product.name,
            unitPricePesewas: line.unitPricePesewas,
            quantity: line.quantity,
            lineTotalPesewas: line.lineTotalPesewas,
            productSnapshotJson: {
              slug: product.slug,
              imageUrl: product.images[0]?.url ?? null,
              ...(line.isDigital ? { msisdn: values.msisdn } : {}),
            },
          },
        });
        await tx.inventoryReservation.create({
          data: {
            orderId: created.id,
            productId: product.id,
            quantity: line.quantity,
            expiresAt: reservationExpiry,
            status: "HELD",
          },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { status: "CONVERTED" } });

    return created;
  });

  await Promise.all(
    vendorOrders.map((entry) => {
      const ownerId = ownerByVendor.get(entry.vendorId);
      if (!ownerId) return Promise.resolve();
      return createNotification({
        userId: ownerId,
        type: "ORDER",
        title: "New order",
        body: `Order ${order.orderNumber} needs your confirmation.`,
        link: "/sell/orders",
      });
    }),
  );

  await writeAuditLog({
    actorId: auth.user.id,
    action: "order.create",
    entityType: "Order",
    entityId: order.id,
    after: { orderNumber: order.orderNumber, totalPesewas: order.totalPesewas },
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return ok({ order }, { status: 201 });
}
