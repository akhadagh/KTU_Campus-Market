import { prisma } from "@/lib/db";
import { markOrderPaid, paystackConfigured, verifyPaystackTransaction } from "@/lib/payments";

async function handleReference(reference: string): Promise<string> {
  if (!paystackConfigured()) return "/orders?payment=unavailable";

  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: { id: true, orderId: true, status: true, order: { select: { orderNumber: true } } },
  });
  if (!payment) return "/orders?payment=unknown";

  if (payment.status !== "SUCCEEDED") {
    try {
      const verification = await verifyPaystackTransaction(reference);
      if (verification.status === "success") {
        await markOrderPaid({
          paymentId: payment.id,
          orderId: payment.orderId,
          raw: verification.raw,
        });
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", rawPayloadJson: verification.raw },
        });
      }
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
