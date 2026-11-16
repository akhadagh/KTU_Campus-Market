import type { Metadata } from "next";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requirePermission(PERMISSION.USER_MANAGE);
  const query = await searchParams;
  const action = query.action ?? "";

  const entries = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      beforeJson: true,
      afterJson: true,
      ipAddress: true,
      createdAt: true,
      actor: { select: { fullName: true, email: true } },
    },
  });

  const actions = [...new Set(entries.map((entry) => entry.action))].sort();

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every sensitive operation, with the actor, the before and after state, and the source address."
      />

      <form action="/admin/audit" method="get" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="audit-action" className="sr-only">
          Filter by action
        </label>
        <input
          id="audit-action"
          name="action"
          defaultValue={action}
          placeholder="e.g. refund"
          className="focus-visible:border-brand-500 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="bg-brand-700 hover:bg-brand-600 h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
        >
          Filter
        </button>
      </form>

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.slice(0, 12).map((item) => (
            <a
              key={item}
              href={`/admin/audit?action=${encodeURIComponent(item)}`}
              className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
            >
              {item}
            </a>
          ))}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={History}
            title="No audit entries"
            description="Administrative and financial operations are recorded here automatically."
          />
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">{entry.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {entry.actor?.fullName ?? "System"}
                      {entry.ipAddress ? (
                        <span className="block text-xs text-neutral-400">{entry.ipAddress}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {entry.entityType}
                      <span className="block text-xs text-neutral-400">{entry.entityId}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      <span className="block max-w-sm truncate">
                        {entry.beforeJson ? JSON.stringify(entry.beforeJson) : "—"}
                      </span>
                      <span className="block max-w-sm truncate text-neutral-400">
                        {entry.afterJson ? JSON.stringify(entry.afterJson) : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
