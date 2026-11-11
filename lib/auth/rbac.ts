import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, type SessionUser } from "@/lib/auth/session";

export const PERMISSION = {
  PRODUCT_CREATE: "product.create",
  PRODUCT_EDIT: "product.edit",
  PRODUCT_MODERATE: "product.moderate",
  ORDER_MANAGE: "order.manage",
  VENDOR_APPROVE: "vendor.approve",
  USER_MANAGE: "user.manage",
  REPORT_REVIEW: "report.review",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION];

export interface AuthContext {
  user: SessionUser;
  roles: string[];
  permissions: Set<string>;
  vendorId: string | null;
  vendorStatus: string | null;
}

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await getSession();
  if (!session) return null;
  const [roleRows, vendor] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId: session.user.id },
      select: {
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    }),
    prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, status: true },
    }),
  ]);
  return {
    user: session.user,
    roles: roleRows.map((row) => row.role.name),
    permissions: new Set(
      roleRows.flatMap((row) => row.role.permissions.map((p) => p.permission.code)),
    ),
    vendorId: vendor?.id ?? null,
    vendorStatus: vendor?.status ?? null,
  };
});

export function hasPermission(auth: AuthContext | null, code: PermissionCode): boolean {
  return Boolean(auth?.permissions.has(code));
}

export function hasRole(auth: AuthContext | null, role: string): boolean {
  return Boolean(auth?.roles.includes(role));
}

export function isAdmin(auth: AuthContext | null): boolean {
  return hasRole(auth, "admin");
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  return auth;
}

export async function requirePermission(code: PermissionCode): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!auth.permissions.has(code)) redirect("/");
  return auth;
}

export async function requireVendor(): Promise<AuthContext & { vendorId: string }> {
  const auth = await requireAuth();
  if (!auth.vendorId) redirect("/sell/apply");
  if (auth.vendorStatus !== "ACTIVE") redirect("/sell/pending");
  return auth as AuthContext & { vendorId: string };
}
