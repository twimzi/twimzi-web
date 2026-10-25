"use client";

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 0.94;

/**
 * Re-encodes static JPEG/PNG images as high-quality WebP to reduce upload size.
 * Alpha transparency is retained. GIF/AVIF/WebP and unsupported formats are
 * passed through unchanged so animated GIFs are never flattened.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!["image/jpeg", "image/png"].includes(file.type) || file.size < 120 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
