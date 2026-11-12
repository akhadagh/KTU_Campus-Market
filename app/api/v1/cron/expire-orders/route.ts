import { fail, ok } from "@/lib/api-response";
import { expireStaleOrders } from "@/lib/orders";

/**
 * Scheduled cleanup of unpaid orders. Intended for Vercel Cron.
 * Requires a bearer token matching CRON_SECRET when the secret is configured.
 */
export async function GET(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (secret) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${secret}`) {
      return fail("FORBIDDEN", "Invalid cron authorization.", 401);
    }
  }

  const expired = await expireStaleOrders();
  return ok({ expired });
}
