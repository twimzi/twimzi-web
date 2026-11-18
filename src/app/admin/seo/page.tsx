import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isSeoDirectoryIndexable,
  matchesSeoDirectoryPage,
  seoDirectoryPages,
} from "@/lib/seo/programmatic-directory";

type PublicBusiness = {
  business_name?: string | null;
  description?: string | null;
  business_type?: string | null;
  city?: string | null;
  state?: string | null;
};

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const supabase = await createSupabaseServerClient();
  const businesses: PublicBusiness[] = [];
  const pageSize = 100;
  let offset = 0;
  let loadError = false;

  while (true) {
    const { data, error } = await supabase.rpc("get_public_businesses_with_location", {
      p_search: null,
      p_location: null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error || !data) {
      console.error("Unable to load public businesses for SEO dashboard:", error);
      loadError = true;
      break;
    }

    businesses.push(...(data as PublicBusiness[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const rows = seoDirectoryPages.map((page) => {
    const matchingBusinesses = businesses.filter((business) =>
      matchesSeoDirectoryPage(business, page),
    );
    const indexable = isSeoDirectoryIndexable(page, matchingBusinesses.length);

    return {
      slug: page.slug,
      keyword: page.keyword,
      count: matchingBusinesses.length,
      indexable,
      reason: indexable
        ? matchingBusinesses.length > 0
          ? "Has matching public listings"
          : "Curated acquisition landing page"
        : "Waiting for first matching public listing",
    };
  });

  const indexableCount = rows.filter((row) => row.indexable).length;
  const waitingCount = rows.length - indexableCount;
  const withListingsCount = rows.filter((row) => row.count > 0).length;

  const stats = [
    { label: "Directory templates", value: rows.length },
    { label: "Indexable pages", value: indexableCount },
    { label: "Waiting for listings", value: waitingCount },
    { label: "Pages with listings", value: withListingsCount },
    { label: "Public businesses scanned", value: businesses.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          Search visibility
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)]">SEO Directory Health</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Live indexability overview for Twimzi programmatic directory pages. Curated
          acquisition pages can be indexed before their first listing; generated
          product-specific pages need at least one matching public business.
        </p>
      </header>

      {loadError ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Business data could not be fully loaded. Counts below may be incomplete.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Directory page status</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              This uses the same indexability helper as page metadata and the XML sitemap.
            </p>
          </div>
          <Link href="/sitemap.xml" target="_blank" className="text-sm font-semibold text-[var(--color-primary)] underline">
            Open XML sitemap
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="bg-[var(--color-background)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Target keyword</th>
                <th className="px-5 py-3 font-semibold">Matching businesses</th>
                <th className="px-5 py-3 font-semibold">Index status</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((row) => (
                <tr key={row.slug}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-[var(--color-text)]">{row.keyword}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">/{row.slug}</p>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{row.count}</td>
                  <td className="px-5 py-3">
                    <span className={row.indexable
                      ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                    }>
                      {row.indexable ? "Indexable" : "Noindex"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">{row.reason}</td>
                  <td className="px-5 py-3">
                    <Link href={`/${row.slug}`} target="_blank" className="font-semibold text-[var(--color-primary)] underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
