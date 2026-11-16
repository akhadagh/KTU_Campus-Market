import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, Scale, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Support requests" };

export default async function SupportRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/requests");

  const [supportThreads, disputes, refunds] = await Promise.all([
    prisma.conversation.findMany({
      where: { buyerId: session.user.id, kind: "SUPPORT" },
      orderBy: { lastMessageAt: "desc" },
      take: 30,
      select: {
        id: true,
        subject: true,
        lastMessageAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
    }),
    prisma.dispute.findMany({
      where: { raisedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.refund.findMany({
      where: { requestedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        amountPesewas: true,
        status: true,
        createdAt: true,
        payment: { select: { order: { select: { orderNumber: true } } } },
      },
    }),
  ]);

  const statusVariant: Record<string, "success" | "warning" | "muted" | "danger"> = {
    OPEN: "warning",
    UNDER_REVIEW: "warning",
    RESOLVED_BUYER: "success",
    RESOLVED_VENDOR: "danger",
    RESOLVED_PARTIAL: "warning",
    CLOSED: "muted",
    REQUESTED: "warning",
    PROCESSING: "warning",
    COMPLETED: "success",
    REJECTED: "danger",
  };

  return (
    <div>
      <PageHeader
        title="Support requests"
        description="Everything you have raised with the JUMART team, with its current status."
      />

      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Support conversations
        </h2>
        {supportThreads.length === 0 ? (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm font-medium text-neutral-900">No support requests</p>
            <p className="mt-1 text-sm text-neutral-600">
              Use &ldquo;Contact JUMART&rdquo; from the messages page to reach the team.
            </p>
            <div className="mt-3 flex justify-center">
              <Link href="/messages" className={buttonVariants({ variant: "outline" })}>
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Open messages
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {supportThreads.map((thread) => (
              <Card key={thread.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/messages?c=${thread.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {thread.subject ?? "Support request"}
                    </Link>
                    {thread.messages[0] ? (
                      <p className="mt-1 line-clamp-1 text-sm text-neutral-600">
                        {thread.messages[0].body}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                      thread.lastMessageAt,
                    )}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Scale className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Reported problems
        </h2>
        {disputes.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            You have not reported a problem on an order. You can report one from the order page.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    {dispute.category.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="text-xs text-neutral-500">Order {dispute.order.orderNumber}</p>
                </div>
                <Badge variant={statusVariant[dispute.status] ?? "muted"}>
                  {dispute.status.replaceAll("_", " ").toLowerCase()}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">Refund requests</h2>
        {refunds.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            You have not requested a refund. Eligible refunds can be requested from the order page.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {refunds.map((refund) => (
              <Card key={refund.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    GH₵{(refund.amountPesewas / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Order {refund.payment.order.orderNumber}
                  </p>
                </div>
                <Badge variant={statusVariant[refund.status] ?? "muted"}>
                  {refund.status.toLowerCase()}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
