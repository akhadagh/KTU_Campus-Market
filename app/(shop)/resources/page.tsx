import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Download, FileText, GraduationCap, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Free past questions & learning materials",
  description:
    "Download free WASSCE past questions, solutions, lecture notes and study materials uploaded by the JUMART team.",
};

const categoryLabels: Record<string, string> = {
  PAST_QUESTIONS: "Past questions",
  NOTES: "Lecture notes",
  SOLUTIONS: "Solutions",
  SYLLABUS: "Syllabus",
  TUTORIAL: "Tutorial",
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; course?: string }>;
}) {
  const query = await searchParams;
  const search = query.q?.trim() ?? "";
  const category = query.category ?? "";
  const course = query.course ?? "";

  const materials = await prisma.learningMaterial.findMany({
    where: {
      status: "PUBLISHED",
      isFree: true,
      ...(category ? { category } : {}),
      ...(course ? { course } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { course: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      course: true,
      level: true,
      category: true,
      fileName: true,
      fileType: true,
      sizeBytes: true,
      downloadCount: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Free learning materials"
        description="Past questions, solutions and lecture notes uploaded by the JUMART team. Free for every student on campus."
      />

      <Card className="border-brand-100 from-brand-50 mt-6 bg-gradient-to-br to-white p-5">
        <div className="flex items-start gap-3">
          <div className="bg-brand-700 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Everything here is free</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              No payment, no account balance, no catch. If a material is missing, ask the JUMART
              team and we will add it.
            </p>
          </div>
        </div>
      </Card>

      <form action="/resources" method="get" className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <label htmlFor="resources-search" className="sr-only">
            Search materials
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <Input
            id="resources-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search mathematics, physics…"
            className="h-11 rounded-full pl-10"
          />
        </div>
        <div>
          <label htmlFor="resources-course" className="sr-only">
            Course
          </label>
          <Input
            id="resources-course"
            name="course"
            defaultValue={course}
            placeholder="Course (optional)"
            className="h-11 rounded-full"
          />
        </div>
        <div>
          <label htmlFor="resources-category" className="sr-only">
            Type
          </label>
          <select
            id="resources-category"
            name="category"
            defaultValue={category}
            className="focus-visible:border-brand-500 focus-visible:ring-brand-500/20 h-11 w-full rounded-full border border-neutral-300 bg-white px-4 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">All types</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {materials.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="No materials published yet"
            description="The JUMART team is preparing past questions and lecture notes. Check back soon, or ask us for the course you need."
            action={
              <Link href="/messages" className={buttonVariants()}>
                Request a material
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card
              key={material.id}
              className="flex flex-col justify-between border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-brand-50 text-brand-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    {categoryLabels[material.category] ?? material.category}
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-neutral-900">{material.title}</h2>
                {material.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {material.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-neutral-500">
                  {[
                    material.course,
                    material.level,
                    formatSize(material.sizeBytes),
                    `${material.downloadCount} download${material.downloadCount === 1 ? "" : "s"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <form
                action={`/api/v1/resources/${material.id}/download`}
                method="post"
                className="mt-4"
              >
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download free
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
