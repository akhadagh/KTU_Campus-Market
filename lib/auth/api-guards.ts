import { getAuthContext, type AuthContext, type PermissionCode } from "@/lib/auth/rbac";
import { fail } from "@/lib/api-response";

export async function requireApiAuth(): Promise<
  { auth: AuthContext; response?: never } | { auth?: never; response: Response }
> {
  const auth = await getAuthContext();
  if (!auth) {
    return { response: fail("AUTH_REQUIRED", "Log in to continue.", 401) };
  }
  return { auth };
}

export async function requireApiVerified(): Promise<
  { auth: AuthContext; response?: never } | { auth?: never; response: Response }
> {
  const result = await requireApiAuth();
  if (result.response) return result;
  if (!result.auth.user.emailVerifiedAt) {
    return {
      response: fail("EMAIL_NOT_VERIFIED", "Verify your email address before you continue.", 403),
    };
  }
  return result;
}

export function requireApiPermission(auth: AuthContext, code: PermissionCode): Response | null {
  if (!auth.permissions.has(code)) {
    return fail("FORBIDDEN", "You do not have permission to do that.", 403);
  }
  return null;
}

export async function requireApiVendor(): Promise<
  | { auth: AuthContext; vendorId: string; response?: never }
  | { auth?: never; vendorId?: never; response: Response }
> {
  const result = await requireApiAuth();
  if (result.response) return result;
  const { auth } = result;
  if (!auth.vendorId) {
    return { response: fail("FORBIDDEN", "Create a vendor store first.", 403) };
  }
  if (auth.vendorStatus !== "ACTIVE") {
    return {
      response: fail("FORBIDDEN", "Your vendor store is not active yet.", 403),
    };
  }
  return { auth, vendorId: auth.vendorId };
}
