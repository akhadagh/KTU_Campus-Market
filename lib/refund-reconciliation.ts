import { prisma } from "@/lib/db";
import { initiatePaystackRefund, paystackConfigured, verifyPaystackTransaction } from "@/lib/payments";
import { createNotification } from "@/lib/notifications";

/**
 * Reconciles refunds with the payment provider.
 *
 * A refund that Paystack reports as successful is closed here; a refund that
 * failed is marked rejected so it is not silently treated as money returned.
 * This never invents a refund: it only confirms or rejects one a human started.
 */
export async function reconcileRefund(refundId: string): Promise<{
  status: "COMPLETED" | "REJECTED" | "UNKNOWN";
  reason?: string;
}> {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      status: true,
      amountPesewas: true,
      payment: {
        select: { id: true, providerReference: true, order: { select: { buyerId: true, orderNumber: true } } },
      },
    },
  });
  if (!refund) return { status: "UNKNOWN", reason: "Refund not found." };
  if (refund.status === "COMPLETED") return { status: "COMPLETED" };

  if (!paystackConfigured()) {
    return { status: "UNKNOWN", reason: "Payments are not configured." };
  }

  try {
    const verification = await verifyPaystackTransaction(refund.payment.providerReference);
    const raw = verification.raw as {
      data?: { refunds?: { status?: string; amount?: number; refund_id?: number | string }[] };
    };
    const providerRefund = raw.data?.refunds?.find(
      (entry) =>
        (entry.refund_id !== undefined && String(entry.refund_id) === refund.id) ||
        (entry.amount !== undefined && entry.amount === refund.amountPesewas),
    );
    const status = providerRefund?.status ?? "unknown";

    if (status === "processed" || status === "successful" || status === "completed") {
      await prisma.$transaction([
        prisma.refund.update({ where: { id: refund.id }, data: { status: "COMPLETED" } }),
        prisma.auditLog.create({
          data: {
            action: "refund.reconciled",
            entityType: "Refund",
            entityId: refund.id,
            beforeJson: { status: refund.status },
            afterJson: { status: "COMPLETED", providerStatus: status },
          },
        }),
      ]);
      await createNotification({
        userId: refund.payment.order.buyerId,
        type: "PAYMENT",
        title: "Refund completed",
        body: `Your refund for order ${refund.payment.order.orderNumber} has been confirmed by the provider.`,
        link: "/orders",
      });
      return { status: "COMPLETED" };
    }

    if (status === "failed" || status === "rejected") {
      await prisma.$transaction([
        prisma.refund.update({
          where: { id: refund.id },
          data: { status: "REJECTED", processedAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            action: "refund.provider_rejected",
            entityType: "Refund",
            entityId: refund.id,
            beforeJson: { status: refund.status },
            afterJson: { status: "REJECTED", providerStatus: status },
          },
        }),
      ]);
      await createNotification({
        userId: refund.payment.order.buyerId,
        type: "PAYMENT",
        title: "Refund not completed",
        body: "The payment provider did not complete your refund. Our team will follow up.",
        link: "/messages",
      });
      return { status: "REJECTED" };
    }

    return { status: "UNKNOWN", reason: `Provider reports "${status}".` };
  } catch (error) {
    return { status: "UNKNOWN", reason: String(error).slice(0, 200) };
  }
}

export async function retryRefund(
  refundId: string,
  actorId: string,
): Promise<{ ok: boolean; message: string }> {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      status: true,
      amountPesewas: true,
      reason: true,
      payment: { select: { providerReference: true } },
    },
  });
  if (!refund) return { ok: false, message: "Refund not found." };
  if (refund.status !== "REJECTED" && refund.status !== "FAILED") {
    return { ok: false, message: "Only rejected refunds can be retried." };
  }

  const provider = await initiatePaystackRefund({
    reference: refund.payment.providerReference,
    amountPesewas: refund.amountPesewas,
    reason: refund.reason ?? "Customer refund",
  });

  await prisma.$transaction([
    prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: provider.success ? "PROCESSING" : "FAILED",
        providerReference: provider.providerReference,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        action: "refund.retried",
        entityType: "Refund",
        entityId: refund.id,
        afterJson: { providerReference: provider.providerReference, success: provider.success },
      },
    }),
  ]);

  return {
    ok: provider.success,
    message: provider.success ? "Refund sent to the provider again." : provider.message,
  };
}
