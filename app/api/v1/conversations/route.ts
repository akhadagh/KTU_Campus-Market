import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { messageSchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  const conversations = await prisma.conversation.findMany({
    where: { buyerId: guard.auth.user.id },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      product: { select: { name: true, slug: true } },
      vendor: { select: { storeName: true, slug: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  return ok({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      lastMessageAt: conversation.lastMessageAt,
      vendorName: conversation.vendor.storeName,
      vendorSlug: conversation.vendor.slug,
      productName: conversation.product?.name ?? null,
      productSlug: conversation.product?.slug ?? null,
      lastMessage: conversation.messages[0]?.body ?? null,
      lastMessageSentAt: conversation.messages[0]?.createdAt ?? null,
    })),
  });
}

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
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Write a message before sending.", 422);
  }
  const values = parsed.data;

  const vendor = await prisma.vendorProfile.findFirst({
    where: { id: values.vendorId, status: "ACTIVE" },
    select: { id: true, userId: true, storeName: true },
  });
  if (!vendor) return fail("NOT_FOUND", "That store is not available.", 404);
  if (vendor.userId === auth.user.id) {
    return fail("VALIDATION_ERROR", "You cannot message your own store.", 422);
  }

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      buyerId: auth.user.id,
      vendorId: vendor.id,
      productId: values.productId ?? null,
    },
    select: { id: true },
  });

  const conversation =
    existingConversation ??
    (await prisma.conversation.create({
      data: {
        buyerId: auth.user.id,
        vendorId: vendor.id,
        productId: values.productId ?? null,
      },
      select: { id: true },
    }));

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: auth.user.id, body: values.body },
    select: { id: true, body: true, createdAt: true },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  await createNotification({
    userId: vendor.userId,
    type: "MESSAGE",
    title: `New message from ${auth.user.fullName}`,
    body: values.body.slice(0, 120),
    link: "/sell/messages",
  });

  return ok({ conversationId: conversation.id, message }, { status: 201 });
}
