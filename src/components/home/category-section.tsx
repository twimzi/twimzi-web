import Link from "next/link";
import {
  BriefcaseBusiness,
  Car,
  Cog,
  Factory,
  GraduationCap,
  HardHat,
  House,
  Laptop,
  MapPin,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Utensils,
  Wheat,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

type Category = {
  id: string;
  parent_id: string | null;
  category_code: string;
  category_name: string;
  slug: string | null;
  description: string | null;
  icon_name: string | null;
  image_media_id: string | null;
  sort_order: number | null;
  is_featured: boolean;
};

function getCategoryIcon(category: Category) {
  const source = [
    category.icon_name,
    category.category_code,
    category.category_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    source.includes("agri") ||
    source.includes("farm") ||
    source.includes("tractor")
  ) {
    return Wheat;
  }

  if (
    source.includes("auto") ||
    source.includes("car") ||
    source.includes("vehicle")
  ) {
    return Car;
  }

  if (
    source.includes("beauty") ||
    source.includes("salon") ||
    source.includes("cosmetic")
  ) {
    return Sparkles;
  }

  if (
    source.includes("construction") ||
    source.includes("building")
  ) {
    return HardHat;
  }

  if (
    source.includes("education") ||
    source.includes("school") ||
    source.includes("college")
  ) {
    return GraduationCap;
  }

  if (
    source.includes("electronic") ||
    source.includes("technology") ||
    source.includes("tech")
  ) {
    return Laptop;
  }

  if (
    source.includes("fashion") ||
    source.includes("apparel") ||
    source.includes("clothing")
  ) {
    return ShoppingBag;
  }

  if (
    source.includes("food") ||
    source.includes("restaurant") ||
    source.includes("hospitality")
  ) {
    return Utensils;
  }

  if (
    source.includes("health") ||
    source.includes("medical") ||
    source.includes("hospital")
  ) {
    return Stethoscope;
  }

  if (source.includes("home") || source.includes("house")) {
    return House;
  }

  if (
    source.includes("industrial") ||
    source.includes("industry")
  ) {
    return Factory;
  }

  if (
    source.includes("professional") ||
    source.includes("business") ||
    source.includes("consult")
  ) {
    return BriefcaseBusiness;
  }

  if (
    source.includes("manufactur") ||
    source.includes("machin")
  ) {
    return Cog;
  }

  if (source.includes("retail") || source.includes("shop")) {
    return ShoppingCart;
  }

  if (
    source.includes("wholesale") ||
    source.includes("distribution") ||
    source.includes("trade")
  ) {
    return Package;
  }

  return MapPin;
}

function getCategoryDescription(category: Category) {
  if (category.description?.trim()) {
    return category.description.trim();
  }

  return `Discover businesses and offerings in ${category.category_name}.`;
}

function getCategoryHref(category: Category) {
  return `/businesses?category=${encodeURIComponent(category.id)}`;
}

const iconThemes = [
  "bg-emerald-50 text-emerald-600",
  "bg-sky-50 text-sky-600",
  "bg-rose-50 text-rose-500",
  "bg-amber-50 text-amber-600",
  "bg-violet-50 text-violet-600",
  "bg-blue-50 text-blue-600",
  "bg-pink-50 text-pink-600",
  "bg-orange-50 text-orange-600",
];

export function CategorySection({
  categories,
  error = false,
}: {
  categories: Category[];
  error?: boolean;
}) {
  const sortedCategories = [...categories]
    .filter((category) => !category.parent_id)
    .sort(
      (a, b) =>
        (a.sort_order ?? 9999) -
        (b.sort_order ?? 9999),
    )
    .slice(0, 8);

  return (
    <section className="bg-white py-20">
      <Container>
        <SectionHeading
          eyebrow="Discover"
          title="Explore by category"
          description="Find the people, businesses, products and services that make your local community work."
        />

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-bold text-red-900">
              Unable to load categories
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Categories could not be loaded right now. Please try again
              shortly.
            </p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-secondary)] p-10 text-center">
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              No categories available
            </h3>

            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              There are currently no active public categories.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sortedCategories.map((category, index) => {
              const Icon = getCategoryIcon(category);

              const iconTheme =
                iconThemes[index % iconThemes.length];

              return (
                <Link
                  key={category.id}
                  href={getCategoryHref(category)}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-xs)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)] sm:p-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.35rem] ${iconTheme} shadow-inner transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="h-10 w-10"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-6 text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-dark)] sm:text-lg">
                        {category.category_name}
                      </h3>

                      <p className="mt-1 line-clamp-3 text-sm leading-5 text-[var(--color-text-muted)]">
                        {getCategoryDescription(category)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-primary)] transition-all group-hover:tracking-wide">
                      Explore category →
                    </span>

                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] opacity-40 transition-all group-hover:w-5 group-hover:rounded-full group-hover:opacity-100"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-primary)] transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
          >
            Explore all categories →
          </Link>
        </div>
      </Container>
    </section>
  );
}