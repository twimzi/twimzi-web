"use client";

const FALLBACK_IMAGE = "/images/blog-image-fallback.svg";

type BlogImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export default function BlogImage({
  src,
  alt,
  className,
  loading = "lazy",
  fetchPriority = "auto",
}: BlogImageProps) {
  const safeSource = typeof src === "string" ? src.trim() : "";
  const isExternalImage = /^https?:\/\//i.test(safeSource);
  const isLocalImage = safeSource.startsWith("/") && !safeSource.startsWith("//");
  const imageSource = isExternalImage || isLocalImage ? safeSource : FALLBACK_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSource}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}
