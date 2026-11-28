"use client";

import Image from "next/image";
import { useState } from "react";

type OptimizedImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/images/blog-image-fallback.svg";
const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "twimzi-media.twimziofficial.workers.dev",
  "assets.science.nasa.gov",
  "www.icar.org.in",
]);

function isTrustedForOptimization(source: string) {
  if (source.startsWith("/") && !source.startsWith("//")) return true;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && (
      OPTIMIZED_HOSTS.has(url.hostname) ||
      url.hostname.endsWith(".supabase.co")
    ) && !/\.svg(?:$|\?)/i.test(url.pathname);
  } catch {
    return false;
  }
}

export default function OptimizedImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
  loading = "lazy",
  fetchPriority = "auto",
  fallbackSrc = DEFAULT_FALLBACK,
}: OptimizedImageProps) {
  const source = typeof src === "string" ? src.trim() : "";
  const validSource = source.startsWith("/") && !source.startsWith("//")
    ? source
    : /^https:\/\//i.test(source) ? source : fallbackSrc;
  const [failed, setFailed] = useState(false);
  const imageSource = failed ? fallbackSrc : validSource;

  return (
    <Image
      src={imageSource}
      alt={alt}
      width={1600}
      height={900}
      sizes={sizes}
      quality={85}
      loading={loading}
      fetchPriority={fetchPriority}
      unoptimized={!isTrustedForOptimization(imageSource)}
      className={className}
      onError={() => {
        if (!failed && imageSource !== fallbackSrc) setFailed(true);
      }}
    />
  );
}
