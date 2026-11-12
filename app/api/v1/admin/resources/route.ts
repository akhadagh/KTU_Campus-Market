import { put } from "@vercel/blob";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";
import { MAX_DOCUMENT_BYTES, detectDocumentType, randomFileName } from "@/lib/uploads";

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

  const uploadLimit = await rateLimitWith(`resource-upload:${guard.auth.user.id}`, 30, {
    windowMs: 10 * 60_000,
    failClosed: true,
  });
  if (!uploadLimit.allowed) {
    return fail("RATE_LIMITED", "Too many uploads. Try again in a few minutes.", 429);
  }
  const ipLimit = await rateLimitWith(`resource-upload-ip:${clientIp(request)}`, 60, {
    windowMs: 10 * 60_000,
    failClosed: true,
  });
  if (!ipLimit.allowed) {
    return fail("RATE_LIMITED", "Too many uploads from this network. Try again later.", 429);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Send the file as multipart form data.", 422);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "Choose a file to upload.", 422);
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return fail("VALIDATION_ERROR", "Files must be 25MB or smaller.", 422);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  // The declared MIME type is never trusted: the file signature is inspected.
  const detected = detectDocumentType(buffer);
  if (!detected) {
    return fail(
      "VALIDATION_ERROR",
      "That file is not a supported PDF, Word, Excel or image file.",
      422,
    );
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

  const extension =
    detected === "application/zip"
      ? "zip"
      : detected === "application/pdf"
        ? "pdf"
        : detected === "application/msword"
          ? "doc"
          : detected === "image/png"
            ? "png"
            : "jpg";

  try {
    const uploaded = await put(`materials/${randomFileName(extension)}`, buffer, {
      access: "public",
      contentType: file.type || detected,
      addRandomSuffix: false,
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
        fileType: detected,
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
