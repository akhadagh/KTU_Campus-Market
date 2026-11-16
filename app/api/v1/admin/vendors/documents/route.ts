import { put } from "@vercel/blob";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { randomFileName } from "@/lib/uploads";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * Vendor verification evidence. Files are stored under unguessable names and
 * are never listed or served publicly: only staff with the vendor review
 * permission receive the link.
 */
export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.VENDOR_APPROVE);
  if (denied) return denied;
  if (!process.env["BLOB_READ_WRITE_TOKEN"]) {
    return fail(
      "PROVIDER_UNAVAILABLE",
      "Document storage is not configured on this deployment.",
      503,
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Send the document as multipart form data.", 422);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "Choose a document to upload.", 422);
  }
  if (file.size === 0) return fail("VALIDATION_ERROR", "The selected file is empty.", 422);
  if (file.size > MAX_BYTES) {
    return fail("VALIDATION_ERROR", "Documents must be 8MB or smaller.", 422);
  }
  if (!ALLOWED.has(file.type)) {
    return fail("VALIDATION_ERROR", "Upload a PDF, JPEG, PNG or WebP document.", 422);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const signature = buffer.slice(0, 5).toString("ascii");
  const isPdf = signature === "%PDF-";
  const isImage =
    (buffer[0] === 0xff && buffer[1] === 0xd8) || (buffer[0] === 0x89 && buffer[1] === 0x50);
  if (!isPdf && !isImage) {
    return fail("VALIDATION_ERROR", "That file is not a valid document.", 422);
  }

  const extension = isPdf ? "pdf" : (file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin");
  try {
    const uploaded = await put(`vendor-documents/${randomFileName(extension)}`, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return ok({ url: uploaded.url, pathname: uploaded.pathname }, { status: 201 });
  } catch {
    return fail("PROVIDER_UNAVAILABLE", "The document could not be stored. Try again.", 502);
  }
}
