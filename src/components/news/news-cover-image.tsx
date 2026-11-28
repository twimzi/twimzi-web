import { BriefcaseBusiness, Factory, Globe2, Newspaper } from "lucide-react";
import OptimizedImage from "@/components/media/optimized-image";

type NewsCoverImageProps = {
  src?: string | null;
  alt: string;
  category: string;
  className?: string;
  featured?: boolean;
};

export default function NewsCoverImage({
  src,
  alt,
  category,
  className = "",
  featured = false,
}: NewsCoverImageProps) {
  const Icon = category === "Trade & Exports"
    ? Globe2
    : category === "Manufacturing"
      ? Factory
      : category === "Markets & Policy"
        ? BriefcaseBusiness
        : Newspaper;

  if (src) {
    return (
      <OptimizedImage
        src={src}
        alt={alt}
        className={className}
        loading={featured ? "eager" : "lazy"}
        fetchPriority={featured ? "high" : "auto"}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 900px"
        fallbackSrc="/images/blog-image-fallback.svg"
      />
    );
  }

  return (
    <div role="img" aria-label={alt || `Editorial illustration for ${category}`} className={`relative flex h-full min-h-[190px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F7F4] via-[#F0FAF8] to-[#FFF7F0] ${className}`}>
      <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/80" />
      <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full border border-white/80" />
      <div className="relative flex flex-col items-center gap-4 px-5 text-center">
        <span className={`flex items-center justify-center rounded-3xl bg-white text-[#0D9488] shadow-lg ${featured ? "h-24 w-24" : "h-16 w-16"}`}>
          <Icon className={featured ? "h-11 w-11" : "h-8 w-8"} strokeWidth={1.6} />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#087F75]">Twimzi Business Desk</span>
        <span className="text-sm font-bold text-slate-700">{category}</span>
      </div>
    </div>
  );
}
