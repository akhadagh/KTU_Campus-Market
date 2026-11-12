import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission(PERMISSION.USER_MANAGE);
  const query = await searchParams;
  const search = query.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastLoginAt: true,
      roles: { select: { role: { select: { name: true } } } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Users"
        description="Suspending an account signs it out everywhere immediately."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <form action="/admin/users" method="get" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <input
          id="user-search"
          name="q"
          defaultValue={search}
          placeholder="Search by name or email"
          className="focus-visible:border-brand-500 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="bg-brand-700 hover:bg-brand-600 h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{user.fullName}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                    {!user.emailVerifiedAt ? (
                      <Badge variant="warning" className="mt-1">
                        Email unverified
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-neutral-500">buyer</span>
                      ) : (
                        user.roles.map((entry) => (
                          <Badge key={entry.role.name} variant="muted">
                            {entry.role.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "success"
                          : user.status === "PENDING_VERIFICATION"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {user.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{user._count.orders}</td>
                  <td className="px-4 py-3 text-right">
                    <UserStatusActions userId={user.id} status={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
