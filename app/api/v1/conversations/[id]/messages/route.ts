import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      buyerId: true,
      vendorId: true,
      kind: true,
      subject: true,
      product: { select: { name: true, slug: true } },
      vendor: { select: { storeName: true, slug: true } },
    },
  });
  if (!conversation) return fail("NOT_FOUND", "Conversation not found.", 404);

  const isBuyer = conversation.buyerId === guard.auth.user.id;
  const isVendorOwner =
    conversation.vendorId === guard.auth.vendorId && guard.auth.vendorStatus === "ACTIVE";
  const isStaff =
    guard.auth.permissions.has("report.review") || guard.auth.permissions.has("user.manage");
  const isSupportThread = conversation.kind === "SUPPORT";
  if (!isBuyer && !isVendorOwner && !(isSupportThread && isStaff)) {
    return fail("FORBIDDEN", "You cannot read this conversation.", 403);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      createdAt: true,
      readAt: true,
      sender: { select: { id: true, fullName: true } },
    },
  });

  await prisma.message.updateMany({
    where: { conversationId: id, readAt: null, senderId: { not: guard.auth.user.id } },
    data: { readAt: new Date() },
  });

  return ok({
    conversation: {
      id: conversation.id,
      kind: conversation.kind,
      subject: conversation.subject,
      vendorName:
        conversation.kind === "SUPPORT"
          ? "JUMART Support"
          : (conversation.vendor?.storeName ?? "Marketplace seller"),
      vendorSlug: conversation.vendor?.slug ?? null,
      productName: conversation.product?.name ?? null,
      productSlug: conversation.product?.slug ?? null,
    },
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      senderId: message.sender.id,
      senderName: message.sender.fullName,
      mine: message.sender.id === guard.auth.user.id,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, buyerId: true, vendorId: true, kind: true },
  });
  if (!conversation) return fail("NOT_FOUND", "Conversation not found.", 404);

  const isBuyer = conversation.buyerId === guard.auth.user.id;
  const isVendorOwner = conversation.vendorId === guard.auth.vendorId;
  const isStaff =
    guard.auth.permissions.has("report.review") || guard.auth.permissions.has("user.manage");
  const isSupportThread = conversation.kind === "SUPPORT";
  if (!isBuyer && !isVendorOwner && !(isSupportThread && isStaff)) {
    return fail("FORBIDDEN", "You cannot post in this conversation.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Write a message before sending.", 422);

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: guard.auth.user.id, body: parsed.data.body },
    select: { id: true, body: true, createdAt: true },
  });
  await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

  const recipientId = isBuyer
    ? conversation.vendorId
      ? (
          await prisma.vendorProfile.findUnique({
            where: { id: conversation.vendorId },
            select: { userId: true },
          })
        )?.userId
      : undefined
    : conversation.buyerId;
  if (recipientId) {
    await createNotification({
      userId: recipientId,
      type: "MESSAGE",
      title: "New message",
      body: parsed.data.body.slice(0, 120),
      link: isBuyer ? "/messages" : "/sell/messages",
    });
  }

  return ok({ message }, { status: 201 });
}
