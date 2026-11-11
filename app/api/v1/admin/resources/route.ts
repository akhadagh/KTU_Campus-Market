import { put } from "@vercel/blob";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
]);

const metaSchema = z.object({
  title: z.string().trim().min(4).max(180),
  description: z.string().trim().max(2000).optional(),
  course: z.string().trim().max(120).optional(),
  level: z.string().trim().max(80).optional(),
  category: z
    .enum(["PAST_QUESTIONS", "NOTES", "SOLUTIONS", "SYLLABUS", "TUTORIAL"])
    .default("PAST_QUESTIONS"),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_MODERATE);
  if (denied) return denied;

  const materials = await prisma.learningMaterial.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
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
      status: true,
      downloadCount: true,
      createdAt: true,
      publishedAt: true,
      uploadedBy: { select: { fullName: true } },
    },
  });

  return ok({ materials });
}

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_MODERATE);
  if (denied) return denied;
  if (!process.env["BLOB_READ_WRITE_TOKEN"]) {
    return fail("PROVIDER_UNAVAILABLE", "File storage is not configured on this deployment.", 503);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Send the file as multipart form data.", 422);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "Choose a file to upload.", 422);
  }
  if (!ALLOWED.has(file.type)) {
    return fail(
      "VALIDATION_ERROR",
      "Upload a PDF, Word, Excel, PowerPoint, text or image file.",
      422,
    );
  }
  if (file.size > MAX_BYTES) {
    return fail("VALIDATION_ERROR", "Files must be 25MB or smaller.", 422);
  }

  const parsed = metaSchema.safeParse({
    title: form.get("title"),
    description: form.get("description") ?? undefined,
    course: form.get("course") ?? undefined,
    level: form.get("level") ?? undefined,
    category: form.get("category") ?? "PAST_QUESTIONS",
  });
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Add a title of at least 4 characters.", 422, {
      title: "Add a title of at least 4 characters",
    });
  }

  const extension = (file.name.split(".").pop() ?? "pdf").toLowerCase().slice(0, 8);
  const safeTitle = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);

  try {
    const uploaded = await put(`materials/${safeTitle}-${Date.now()}.${extension}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });

    const material = await prisma.learningMaterial.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        course: parsed.data.course || null,
        level: parsed.data.level || null,
        category: parsed.data.category,
        fileUrl: uploaded.url,
        fileName: file.name,
        fileType: file.type,
        sizeBytes: file.size,
        isFree: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
        uploadedById: guard.auth.user.id,
      },
      select: { id: true, title: true, fileUrl: true, status: true },
    });

    return ok({ material }, { status: 201 });
  } catch {
    return fail("PROVIDER_UNAVAILABLE", "The file could not be stored. Try again.", 502);
  }
}
