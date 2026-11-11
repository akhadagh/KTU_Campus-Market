import type { Metadata } from "next";
import { Archive, BookOpen, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ResourceUploadForm } from "@/components/admin/resource-upload-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Learning materials" };

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default async function AdminResourcesPage() {
  await requirePermission(PERMISSION.PRODUCT_MODERATE);

  const materials = await prisma.learningMaterial.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      course: true,
      category: true,
      fileName: true,
      sizeBytes: true,
      status: true,
      downloadCount: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Learning materials"
        description="Upload past questions, solutions and lecture notes that every student can download for free."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Upload a new material</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Files are stored securely and published straight to the free learning materials page.
        </p>
        <div className="mt-5">
          <ResourceUploadForm />
        </div>
      </Card>

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight text-neutral-900">
        Published materials
      </h2>

      {materials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing uploaded yet"
          description="Upload your first set of past questions using the form above."
        />
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <Card key={material.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{material.title}</p>
                  <Badge variant={material.status === "PUBLISHED" ? "success" : "muted"}>
                    {material.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {[
                    material.course,
                    material.fileName,
                    formatSize(material.sizeBytes),
                    `${material.downloadCount} download${material.downloadCount === 1 ? "" : "s"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <a
                href={material.fileName ? `#${material.id}` : "#"}
                className="text-brand-700 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                onClick={(event) => event.preventDefault()}
              >
                Preview
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                  material.createdAt,
                )}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
