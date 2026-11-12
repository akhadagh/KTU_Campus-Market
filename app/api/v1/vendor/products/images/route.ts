import { put } from "@vercel/blob";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";
import {
  DAILY_UPLOAD_QUOTA,
  MAX_IMAGE_BYTES,
  countVendorImages,
  detectImageType,
  randomFileName,
  sanitiseImage,
} from "@/lib/uploads";

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

  const uploadLimit = await rateLimitWith(`product-image:${guard.auth.user.id}`, 30, {
    windowMs: 10 * 60_000,
    failClosed: true,
  });
  if (!uploadLimit.allowed) {
    return fail("RATE_LIMITED", "Too many uploads. Try again in a few minutes.", 429);
  }
  const ipLimit = await rateLimitWith(`product-image-ip:${clientIp(request)}`, 60, {
    windowMs: 10 * 60_000,
    failClosed: true,
  });
  if (!ipLimit.allowed) {
    return fail("RATE_LIMITED", "Too many uploads from this network. Try again later.", 429);
  }

  const owned = await countVendorImages(guard.auth.user.id);
  if (owned >= DAILY_UPLOAD_QUOTA) {
    return fail(
      "RATE_LIMITED",
      `You have reached the limit of ${DAILY_UPLOAD_QUOTA} images. Remove an image before adding more.`,
      429,
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Send the image as multipart form data.", 422);

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "Choose an image to upload.", 422);
  }
  if (file.size === 0) {
    return fail("VALIDATION_ERROR", "The selected file is empty.", 422);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("VALIDATION_ERROR", "Images must be 5MB or smaller.", 422);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // The declared MIME type is never trusted; the content is inspected.
  const detected = detectImageType(buffer);
  if (!detected) {
    return fail("VALIDATION_ERROR", "That file is not a valid JPEG, PNG, WebP or AVIF image.", 422);
  }

  try {
    const sanitised = await sanitiseImage(buffer);
    const uploaded = await put(
      `products/${randomFileName(sanitised.extension)}`,
      sanitised.buffer,
      { access: "public", contentType: sanitised.contentType, addRandomSuffix: false },
    );

    return ok(
      {
        url: uploaded.url,
        pathname: uploaded.pathname,
        width: sanitised.width,
        height: sanitised.height,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[upload] failed to process image", error);
    return fail("PROVIDER_UNAVAILABLE", "The image could not be processed. Try another file.", 502);
  }
}

export async function DELETE(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");
  const productId = url.searchParams.get("productId");
  if (!imageUrl || !productId) {
    return fail("VALIDATION_ERROR", "Provide the image URL and product to remove.", 422);
  }

  // Ownership check: the product must belong to the vendor's store.
  const product = await prisma.product.findFirst({
    where: { id: productId, vendor: { userId: guard.auth.user.id }, deletedAt: null },
    select: { id: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  const image = await prisma.productImage.findFirst({
    where: { productId: product.id, url: imageUrl },
    select: { id: true, url: true },
  });
  if (!image) return fail("NOT_FOUND", "Image not found.", 404);

  await prisma.productImage.delete({ where: { id: image.id } });

  const { deleteStoredFile } = await import("@/lib/uploads");
  await deleteStoredFile(image.url);

  return ok({ removed: true });
}
