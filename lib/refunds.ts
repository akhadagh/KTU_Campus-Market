import { prisma } from "@/lib/db";
import { initiatePaystackRefund } from "@/lib/payments";
import { createNotification } from "@/lib/notifications";

export const REFUND_WINDOW_DAYS = 14;

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  maxRefundablePesewas: number;
  refundedPesewas: number;
}

export async function assessRefundEligibility(orderId: string): Promise<RefundEligibility> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      totalPesewas: true,
      placedAt: true,
      payments: {
        where: { status: "SUCCEEDED" },
        select: {
          id: true,
          amountPesewas: true,
          providerReference: true,
          refunds: { select: { amountPesewas: true, status: true } },
        },
      },
    },
  });

  if (!order) {
    return {
      eligible: false,
      reason: "Order not found.",
      maxRefundablePesewas: 0,
      refundedPesewas: 0,
    };
  }

  const orderRefunds = order.payments.flatMap((payment) => payment.refunds);
  const refundedPesewas = orderRefunds
    .filter((refund) => refund.status === "COMPLETED")
    .reduce((total, refund) => total + refund.amountPesewas, 0);
  const maxRefundablePesewas = Math.max(0, order.totalPesewas - refundedPesewas);

  if (order.status !== "PAID" && order.status !== "PARTIALLY_FULFILLED") {
    return {
      eligible: false,
      reason: "Only paid orders can be refunded.",
      maxRefundablePesewas,
      refundedPesewas,
    };
  }

  const windowEnd = new Date(order.placedAt.getTime() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (windowEnd.getTime() < Date.now()) {
    return {
      eligible: false,
      reason: `The ${REFUND_WINDOW_DAYS}-day refund window for this order has closed.`,
      maxRefundablePesewas,
      refundedPesewas,
    };
  }

  if (maxRefundablePesewas <= 0) {
    return {
      eligible: false,
      reason: "This order has already been refunded in full.",
      maxRefundablePesewas,
      refundedPesewas,
    };
  }

  const openRequest = orderRefunds.some((refund) => refund.status === "REQUESTED");
  if (openRequest) {
    return {
      eligible: false,
      reason: "A refund request for this order is already being reviewed.",
      maxRefundablePesewas,
      refundedPesewas,
    };
  }

  return { eligible: true, maxRefundablePesewas, refundedPesewas };
}

export async function approveRefund(input: {
  refundId: string;
  actorId: string;
  note?: string;
}): Promise<{ ok: boolean; message: string }> {
  const refund = await prisma.refund.findUnique({
    where: { id: input.refundId },
    select: {
      id: true,
      status: true,
      amountPesewas: true,
      reason: true,
      payment: {
        select: {
          id: true,
          providerReference: true,
          status: true,
          order: { select: { id: true, orderNumber: true, buyerId: true, status: true } },
        },
      },
    },
  });

  if (!refund) return { ok: false, message: "Refund request not found." };
  if (refund.status !== "REQUESTED" && refund.status !== "APPROVED") {
    return { ok: false, message: `This refund is already ${refund.status.toLowerCase()}.` };
  }
  if (refund.payment.status !== "SUCCEEDED") {
    return { ok: false, message: "The original payment was never completed." };
  }

  const eligibility = await assessRefundEligibility(refund.payment.order.id);
  if (!eligibility.eligible) return { ok: false, message: eligibility.reason ?? "Not eligible." };
  if (refund.amountPesewas > eligibility.maxRefundablePesewas) {
    return { ok: false, message: "The refund amount exceeds the amount still refundable." };
  }

  const provider = await initiatePaystackRefund({
    reference: refund.payment.providerReference,
    amountPesewas: refund.amountPesewas,
    reason: refund.reason ?? "Customer refund",
  });

  await prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: provider.success ? "PROCESSING" : "REJECTED",
        providerReference: provider.providerReference,
        processedById: input.actorId,
        processedAt: new Date(),
        reason: input.note
          ? `${refund.reason ?? "Customer refund"} — ${input.note}`
          : refund.reason,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: provider.success ? "refund.processing" : "refund.rejected",
        entityType: "Refund",
        entityId: refund.id,
        beforeJson: { status: refund.status },
        afterJson: {
          status: provider.success ? "PROCESSING" : "REJECTED",
          amountPesewas: refund.amountPesewas,
          providerReference: provider.providerReference,
          note: input.note ?? null,
        },
      },
    });
  });

  await createNotification({
    userId: refund.payment.order.buyerId,
    type: "SYSTEM",
    title: provider.success ? "Refund approved" : "Refund request declined",
    body: provider.success
      ? `A refund of the requested amount for order ${refund.payment.order.orderNumber} is being processed.`
      : (input.note ?? "Your refund request could not be completed. Please contact support."),
    link: "/orders",
  });

  return {
    ok: provider.success,
    message: provider.success
      ? "Refund sent to Paystack and marked as processing."
      : provider.message,
  };
}
