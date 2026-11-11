import { put } from "@vercel/blob";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_CREATE);
  if (denied) return denied;
  if (!guard.auth.vendorId || guard.auth.vendorStatus !== "ACTIVE") {
    return fail("FORBIDDEN", "An active vendor store is required to upload images.", 403);
  }
  if (!process.env["BLOB_READ_WRITE_TOKEN"]) {
    return fail(
      "PROVIDER_UNAVAILABLE",
      "Image uploads are not configured on this deployment. Add an image URL instead.",
      503,
    );
  }
  if (!rateLimit(`product-image:${guard.auth.user.id}`, 30, 10 * 60_000)) {
    return fail("RATE_LIMITED", "Too many uploads. Try again in a few minutes.", 429);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Send the image as multipart form data.", 422);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "Choose an image to upload.", 422);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail("VALIDATION_ERROR", "Upload a JPEG, PNG, WebP or AVIF image.", 422);
  }
  if (file.size > MAX_BYTES) {
    return fail("VALIDATION_ERROR", "Images must be 5MB or smaller.", 422);
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const safeName = `${guard.auth.vendorId}-${Date.now()}.${extension}`;

  try {
    const result = await put(`products/${safeName}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });
    return ok({ url: result.url, pathname: result.pathname }, { status: 201 });
  } catch {
    return fail("PROVIDER_UNAVAILABLE", "The image could not be stored. Try again.", 502);
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return fail("VALIDATION_ERROR", "Provide the image URL to remove.", 422);

  const product = await prisma.product.findFirst({
    where: {
      id: new URL(request.url).searchParams.get("productId") ?? "",
      vendor: { userId: guard.auth.user.id },
    },
    select: { id: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  await prisma.productImage.deleteMany({ where: { productId: product.id, url } });
  return ok({ removed: true });
}
