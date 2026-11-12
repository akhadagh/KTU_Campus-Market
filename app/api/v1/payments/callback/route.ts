import { prisma } from "@/lib/db";
import {
  confirmPaymentFromVerification,
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/payments";

async function handleReference(reference: string): Promise<string> {
  if (!paystackConfigured()) return "/orders?payment=unavailable";

  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: {
      id: true,
      orderId: true,
      status: true,
      order: { select: { orderNumber: true } },
    },
  });
  if (!payment) return "/orders?payment=unknown";

  if (payment.status !== "SUCCEEDED") {
    try {
      // The browser returning from Paystack proves nothing: the transaction is
      // verified with the provider and compared with the stored payment.
      const verification = await verifyPaystackTransaction(reference);
      const result = await confirmPaymentFromVerification({
        paymentId: payment.id,
        verification,
        source: "callback",
      });

      if (result.outcome === "paid" || result.outcome === "already_paid") {
        return `/orders?paid=1&order=${result.orderNumber}`;
      }
      if (result.outcome === "rejected") {
        return `/orders?payment=${result.reason}`;
      }
      return "/orders?payment=unverified";
    } catch {
      return "/orders?payment=unverified";
    }
  }

  return `/orders?paid=1&order=${payment.order.orderNumber}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  if (!reference) return Response.redirect(new URL("/orders?payment=unknown", url.origin), 302);
  const target = await handleReference(reference);
  return Response.redirect(new URL(target, url.origin), 302);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const reference = url.searchParams.get("reference") ?? String(form?.get("reference") ?? "");
  if (!reference) return Response.redirect(new URL("/orders?payment=unknown", url.origin), 302);
  const target = await handleReference(reference);
  return Response.redirect(new URL(target, url.origin), 302);
}
