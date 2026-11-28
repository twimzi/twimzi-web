import OptimizedImage from "@/components/media/optimized-image";

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
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    />
  );
}
