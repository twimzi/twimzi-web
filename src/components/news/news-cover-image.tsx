"use client";

import { useState } from "react";
import { BriefcaseBusiness, Factory, Globe2, Newspaper } from "lucide-react";

type NewsCoverImageProps = {
  src?: string | null;
  alt: string;
  category: string;
  className?: string;
  featured?: boolean;
};

export default function NewsCoverImage({ src, alt, category, className = "", featured = false }: NewsCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = category === "Trade & Exports" ? Globe2 : category === "Manufacturing" ? Factory : category === "Markets & Policy" ? BriefcaseBusiness : Newspaper;

  if (src && !failed) {
    return <img src={src} alt={alt} loading={featured ? "eager" : "lazy"} fetchPriority={featured ? "high" : "auto"} onError={() => setFailed(true)} className={className} />;
  }

  return (
    <div role="img" aria-label={alt || `Editorial illustration for ${category}`} className={`relative flex h-full min-h-[190px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#EDE7FF] via-[#EAF4FF] to-[#E6FBFF] ${className}`}>
      <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/80" />
      <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full border border-white/80" />
      <div className="relative flex flex-col items-center gap-4 px-5 text-center">
        <span className={`flex items-center justify-center rounded-3xl bg-white text-[#1879FD] shadow-lg ${featured ? "h-24 w-24" : "h-16 w-16"}`}>
          <Icon className={featured ? "h-11 w-11" : "h-8 w-8"} strokeWidth={1.6} />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7000D6]">Twimzi Business Desk</span>
        <span className="text-sm font-bold text-[#263d70]">{category}</span>
      </div>
    </div>
  );
}
