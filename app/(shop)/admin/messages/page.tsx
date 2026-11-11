import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { MessageThread } from "@/components/messaging/message-thread";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Support inbox" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  await requirePermission(PERMISSION.REPORT_REVIEW);
  const query = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: { kind: "SUPPORT" },
    orderBy: { lastMessageAt: "desc" },
    take: 60,
    select: {
      id: true,
      subject: true,
      lastMessageAt: true,
      buyer: { select: { id: true, fullName: true, email: true } },
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
        title="Support inbox"
        description="Requests sent to the JUMART team by students and vendors."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      {conversations.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={LifeBuoy}
            title="No support requests"
            description="Messages sent from the Contact JUMART form land here."
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/admin/messages?c=${conversation.id}`}
                className={cn(
                  "focus-visible:ring-brand-500/30 block rounded-xl border bg-white p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  conversation.id === active?.id
                    ? "border-brand-500"
                    : "border-neutral-200 hover:bg-neutral-50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{conversation.subject}</p>
                  <span className="shrink-0 text-[11px] text-neutral-500">
                    {formatDate(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{conversation.buyer.fullName}</p>
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
                <p className="text-sm font-semibold text-neutral-900">{active.subject}</p>
                <p className="mb-3 text-xs text-neutral-500">
                  {active.buyer.fullName} · {active.buyer.email}
                </p>
                <MessageThread
                  conversationId={active.id}
                  peerName={active.buyer.fullName}
                  messages={messages.map((message) => ({
                    id: message.id,
                    body: message.body,
                    createdAt: message.createdAt.toISOString(),
                    mine: false,
                    senderName: message.sender.fullName,
                  }))}
                />
              </>
            ) : (
              <p className="text-sm text-neutral-600">Select a request to read it.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
