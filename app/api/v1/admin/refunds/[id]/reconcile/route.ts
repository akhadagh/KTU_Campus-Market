import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { reconcileRefund, retryRefund } from "@/lib/refund-reconciliation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.ORDER_MANAGE);
  if (denied) return denied;

  const { id } = await params;
  const result = await reconcileRefund(id);
  return ok(result);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.ORDER_MANAGE);
  if (denied) return denied;

  const { id } = await params;
  const result = await retryRefund(id, guard.auth.user.id);
  if (!result.ok) return fail("CONFLICT", result.message, 409);
  return ok(result);
}
