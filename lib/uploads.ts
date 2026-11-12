import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 2000;
export const DAILY_UPLOAD_QUOTA = 120;

export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

/**
 * Detects the real content type from the file signature. The declared MIME type
 * from the browser is never trusted.
 */
export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer.slice(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(buffer.slice(8, 12).toString("ascii"))
  ) {
    return "image/avif";
  }
  return null;
}

export function detectDocumentType(buffer: Buffer): string | null {
  if (buffer.length < 5) return null;
  const head = buffer.slice(0, 5).toString("ascii");
  if (head === "%PDF-") return "application/pdf";
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf) return "application/msword";
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    // Office Open XML (docx/xlsx/pptx) and other zip containers.
    return "application/zip";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  return null;
}

export interface SanitisedImage {
  buffer: Buffer;
  contentType: "image/jpeg";
  extension: "jpg";
  width: number;
  height: number;
}

/**
 * Re-encodes an uploaded image: EXIF metadata (including GPS) is dropped, the
 * image is auto-rotated from its EXIF orientation, resized to a sane maximum
 * and written as a clean JPEG. The result can never contain metadata or an
 * unexpected payload.
 */
export async function sanitiseImage(buffer: Buffer): Promise<SanitisedImage> {
  const pipeline = sharp(buffer, { failOn: "none", limitInputPixels: 50_000_000 });
  const output = await pipeline
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    contentType: "image/jpeg",
    extension: "jpg",
    width: output.info.width,
    height: output.info.height,
  };
}

export function randomFileName(extension: string): string {
  return `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"}`;
}

/** Counts the images a vendor owns across all of their products. */
export async function countVendorImages(userId: string): Promise<number> {
  return prisma.productImage.count({
    where: { product: { vendor: { userId } } },
  });
}

/** Removes the stored object when a database reference is deleted. */
export async function deleteStoredFile(url: string): Promise<void> {
  if (!url.includes("blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch {
    // The database reference is removed regardless; a leftover object is
    // reported by the orphan sweep.
  }
}

/**
 * Deletes stored files that are no longer referenced by any database row.
 * Intended to run as a scheduled maintenance job.
 */
export async function sweepOrphanedFiles(): Promise<number> {
  const [images, materials] = await Promise.all([
    prisma.productImage.findMany({ select: { id: true, url: true } }),
    prisma.learningMaterial.findMany({ select: { id: true, fileUrl: true } }),
  ]);
  const referenced = new Set([...images.map((i) => i.url), ...materials.map((m) => m.fileUrl)]);

  let removed = 0;
  const { list } = await import("@vercel/blob");
  const blobs = await list({ limit: 500 });
  for (const blob of blobs.blobs) {
    if (!referenced.has(blob.url)) {
      await deleteStoredFile(blob.url);
      removed += 1;
    }
  }
  return removed;
}
