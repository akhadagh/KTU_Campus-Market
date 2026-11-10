import { ok } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const auth = await getSession();
  return ok({ user: auth?.user ?? null });
}
