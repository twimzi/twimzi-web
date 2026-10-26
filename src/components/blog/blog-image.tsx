"use client";

import { useState } from "react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";

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
  const [useFallback, setUseFallback] = useState(false);
  const safeSource = typeof src === "string" ? src.trim() : "";
  const imageSource = !useFallback && /^https?:\/\//i.test(safeSource)
    ? safeSource
    : FALLBACK_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSource}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => {
        if (!useFallback) setUseFallback(true);
      }}
    />
  );
}
