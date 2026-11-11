import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { MessageThread } from "@/components/messaging/message-thread";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/messages");
  const query = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: { buyerId: session.user.id },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      vendor: { select: { storeName: true, slug: true } },
      product: { select: { name: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
    },
  });

  const activeId = query.c ?? conversations[0]?.id ?? null;
  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  const messages = active
    ? await prisma.message.findMany({
        where: { conversationId: active.id },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: { select: { id: true, fullName: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Messages"
        description="Talk to sellers about products, pickup points, and delivery."
      />

      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Message a seller from any store page to start a conversation."
            action={
              <Link
                href="/marketplace"
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Browse the marketplace
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages?c=${conversation.id}`}
                className={cn(
                  "focus-visible:ring-brand-500/30 block rounded-xl border bg-white p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  conversation.id === active?.id
                    ? "border-brand-500"
                    : "border-neutral-200 hover:bg-neutral-50",
                )}
              >
                <p className="text-sm font-semibold text-neutral-900">
                  {conversation.vendor.storeName}
                </p>
                {conversation.product ? (
                  <p className="text-xs text-neutral-500">About {conversation.product.name}</p>
                ) : null}
                {conversation.messages[0] ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                    {conversation.messages[0].body}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>

          <Card className="flex min-h-[24rem] flex-col p-5">
            {active ? (
              <>
                <p className="text-sm font-semibold text-neutral-900">{active.vendor.storeName}</p>
                {active.product ? (
                  <p className="mb-3 text-xs text-neutral-500">About {active.product.name}</p>
                ) : (
                  <div className="mb-3" />
                )}
                <MessageThread
                  conversationId={active.id}
                  peerName={active.vendor.storeName}
                  messages={messages.map((message) => ({
                    id: message.id,
                    body: message.body,
                    createdAt: message.createdAt.toISOString(),
                    mine: message.sender.id === session.user.id,
                    senderName: message.sender.fullName,
                  }))}
                />
              </>
            ) : (
              <p className="text-sm text-neutral-600">Select a conversation to read it.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
