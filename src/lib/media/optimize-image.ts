"use client";

/**
 * Twimzi upload image policy:
 * - Store static raster uploads as WebP for broad browser support and smaller files.
 * - Preserve high visual quality (quality 0.98).
 * - Keep up to 3000 pixels on the longest edge for sharp high-density displays.
 * - Never upscale small images.
 * - Do not flatten animated GIFs or rasterize SVG/vector assets.
 *
 * Note: WebP is lossy even at high quality. This helper deliberately uses a
 * very high quality setting and only downsizes images exceeding 3000px.
 */
const MAX_DIMENSION = 3000;
const WEBP_QUALITY = 0.98;

const CONVERTIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (
    file.type === "image/webp" ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml" ||
    !CONVERTIBLE_IMAGE_TYPES.has(file.type)
  ) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Fail safe: never block an upload or destroy the source if decoding fails.
    return file;
  }

  try {
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return file;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    // Preserve the original file if the browser cannot encode WebP.
    return file;
  } finally {
    bitmap.close();
  }
}
