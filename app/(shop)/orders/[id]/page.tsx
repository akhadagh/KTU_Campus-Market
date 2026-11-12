import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderSupportActions } from "@/components/commerce/order-support-actions";
import { PayOrderButton } from "@/components/commerce/pay-order-button";
import { ReviewForm } from "@/components/commerce/review-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { orderStatusLabels, statusBadgeVariant, vendorOrderStatusLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Order details" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, buyerId: session.user.id, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotalPesewas: true,
      deliveryTotalPesewas: true,
      totalPesewas: true,
      deliveryMethod: true,
      notes: true,
      placedAt: true,
      deliveryAddressJson: true,
      vendorOrders: {
        select: {
          id: true,
          status: true,
          subtotalPesewas: true,
          deliveryFeePesewas: true,
          totalPesewas: true,
          fulfillmentType: true,
          vendor: { select: { storeName: true, slug: true, phone: true, whatsapp: true } },
          items: {
            select: {
              id: true,
              titleSnapshot: true,
              unitPricePesewas: true,
              quantity: true,
              lineTotalPesewas: true,
              product: { select: { slug: true } },
              productSnapshotJson: true,
              review: { select: { id: true, status: true } },
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          amountPesewas: true,
          paidAt: true,
          refunds: { select: { id: true, amountPesewas: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      disputes: {
        select: { id: true, status: true, category: true },
      },
      statusHistory: {
        select: { toStatus: true, reason: true, createdAt: true, actorType: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) notFound();

  const orderRefunds = order.payments.flatMap((payment) => payment.refunds);
  const completedRefunds = orderRefunds.filter((refund) => refund.status === "COMPLETED");
  const refundedPesewas = completedRefunds.reduce(
    (total, refund) => total + refund.amountPesewas,
    0,
  );
  const maxRefundCedis = Math.max(0, (order.totalPesewas - refundedPesewas) / 100);
  const openDispute = order.disputes.some((dispute) =>
    ["OPEN", "UNDER_REVIEW"].includes(dispute.status),
  );
  const canRefund =
    ["PAID", "PARTIALLY_FULFILLED"].includes(order.status) &&
    maxRefundCedis >= 1 &&
    !orderRefunds.some((refund) => refund.status === "REQUESTED");
  const canDispute =
    ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"].includes(order.status) && !openDispute;

  const address = order.deliveryAddressJson as {
    fullName?: string;
    phone?: string;
    address?: string;
    instructions?: string;
  } | null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.placedAt)}`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={statusBadgeVariant(order.status)}>
          {orderStatusLabels[order.status] ?? order.status}
        </Badge>
        {order.status === "PENDING_PAYMENT" ? (
          <PayOrderButton orderId={order.id} label="Pay this order" />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-4">
          {order.vendorOrders.map((vendorOrder) => (
            <Card key={vendorOrder.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/stores/${vendorOrder.vendor.slug}`}
                  className="text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {vendorOrder.vendor.storeName}
                </Link>
                <Badge variant={statusBadgeVariant(vendorOrder.status)}>
                  {vendorOrderStatusLabels[vendorOrder.status] ?? vendorOrder.status}
                </Badge>
              </div>
              <ul className="mt-3 divide-y divide-neutral-100">
                {vendorOrder.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 text-sm text-neutral-800">
                      {item.titleSnapshot} × {item.quantity}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-neutral-900">
                      {formatPesewas(item.lineTotalPesewas)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-neutral-100 pt-3 text-sm font-medium text-neutral-900">
                Seller total: {formatPesewas(vendorOrder.totalPesewas)}
              </p>
              {vendorOrder.status === "DELIVERED" ? (
                <div className="mt-4 space-y-3">
                  {vendorOrder.items.map((item) =>
                    item.review ? (
                      <p key={item.id} className="text-xs text-neutral-600">
                        You reviewed {item.titleSnapshot}
                        {item.review.status === "PUBLISHED"
                          ? " (published)"
                          : item.review.status === "PENDING"
                            ? " (awaiting moderation)"
                            : ""}
                      </p>
                    ) : (
                      <ReviewForm
                        key={item.id}
                        orderItemId={item.id}
                        productName={item.titleSnapshot}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </Card>
          ))}

          {order.statusHistory.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Status history</h2>
              <ol className="mt-3 space-y-2">
                {order.statusHistory.map((entry, index) => (
                  <li key={index} className="text-sm text-neutral-700">
                    <span className="font-medium text-neutral-900">
                      {orderStatusLabels[entry.toStatus] ?? entry.toStatus}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {formatDate(entry.createdAt)}
                      {entry.reason ? ` · ${entry.reason}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Totals</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <dt>Subtotal</dt>
                <dd className="text-neutral-900">{formatPesewas(order.subtotalPesewas)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Delivery</dt>
                <dd className="text-neutral-900">{formatPesewas(order.deliveryTotalPesewas)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
                <dt>Total</dt>
                <dd>{formatPesewas(order.totalPesewas)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-neutral-500">
              Fulfilment: {order.deliveryMethod.replaceAll("_", " ").toLowerCase()}
            </p>
          </Card>

          {address ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Delivery address</h2>
              <p className="mt-2 text-sm text-neutral-700">{address.fullName}</p>
              <p className="text-sm text-neutral-700">{address.phone}</p>
              <p className="text-sm text-neutral-700">{address.address}</p>
              {address.instructions ? (
                <p className="mt-1 text-xs text-neutral-500">{address.instructions}</p>
              ) : null}
            </Card>
          ) : null}

          {order.payments.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Payments</h2>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between gap-2">
                    <span>
                      {payment.provider} · {payment.status}
                    </span>
                    <span>{formatPesewas(payment.amountPesewas)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {order.notes ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Order note</h2>
              <p className="mt-2 text-sm text-neutral-700">{order.notes}</p>
            </Card>
          ) : null}

          <OrderSupportActions
            orderId={order.id}
            maxRefundCedis={maxRefundCedis}
            canRefund={canRefund}
            canDispute={canDispute}
          />

          {orderRefunds.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Refunds</h2>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                {orderRefunds.map((refund) => (
                  <li key={refund.id}>
                    {formatPesewas(refund.amountPesewas)} · {refund.status.toLowerCase()}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {order.disputes.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-neutral-900">Reported problems</h2>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                {order.disputes.map((dispute) => (
                  <li key={dispute.id}>
                    {dispute.category.replaceAll("_", " ").toLowerCase()} ·{" "}
                    {dispute.status.replaceAll("_", " ").toLowerCase()}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
