import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowDownUp, Package, Search, Store, TrendingUp } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Product Price Discovery in India | Twimzi",
  description: "Explore current supplier-listed product prices on Twimzi. Search products, set your budget and compare available supplier listings.",
  alternates: { canonical: "https://www.twimzi.com/products/prices" },
};

type Product = {
  id: string; business_name: string | null; business_slug: string | null;
  product_name: string | null; slug: string | null; short_description: string | null;
  description: string | null; brand: string | null; model: string | null;
  selling_price: number | null; mrp: number | null; thumbnail_url: string | null;
  is_featured: boolean | null;
};
type SearchParams = { q?: string; min?: string; max?: string; sort?: string };

function numberParam(value?: string) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function price(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function PriceCard({ product }: { product: Product }) {
  const name = product.product_name?.trim() || "Unnamed product";
  const businessHref = product.business_slug ? `/businesses/${product.business_slug}` : "/businesses";
  const href = product.slug ? `/products/${product.slug}` : businessHref;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <Link href={href} className="flex aspect-[5/3] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-cyan-50">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail_url} alt={name} loading="lazy" className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]" />
        ) : <Package className="h-12 w-12 text-blue-300" />}
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 font-bold leading-6 text-slate-900">{name}</h2>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Listed price</span>
        </div>
        {(product.brand || product.model) ? <p className="mt-1 text-xs text-slate-500">{[product.brand, product.model].filter(Boolean).join(" · ")}</p> : null}
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{product.short_description || product.description || "Contact the supplier for specifications and availability."}</p>
        <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">{price(Number(product.selling_price))}</p>
        {product.mrp !== null && Number(product.mrp) > Number(product.selling_price) ? <p className="mt-1 text-sm text-slate-400 line-through">{price(Number(product.mrp))}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link href={businessHref} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><Store className="h-4 w-4 shrink-0" /><span className="truncate">{product.business_name || "Supplier"}</span></Link>
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-blue-700 hover:gap-2">View <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </article>
  );
}

export default async function ProductPriceDiscoveryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const min = numberParam(params.min);
  const max = numberParam(params.max);
  const sort = params.sort === "high" ? "high" : "low";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_products", { p_search: query || null, p_limit: 100, p_offset: 0 });
  const allProducts = (data ?? []) as Product[];
  // In the existing catalogue, zero means no supplier price was entered.
  const priced = allProducts.filter((item) => item.selling_price !== null && Number.isFinite(Number(item.selling_price)) && Number(item.selling_price) > 0);
  const values = priced.map((item) => Number(item.selling_price));
  const lowest = values.length ? Math.min(...values) : null;
  const highest = values.length ? Math.max(...values) : null;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const filtered = priced.filter((item) => min === null || Number(item.selling_price) >= min).filter((item) => max === null || Number(item.selling_price) <= max).sort((a,b) => sort === "high" ? Number(b.selling_price)-Number(a.selling_price) : Number(a.selling_price)-Number(b.selling_price));

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-blue-700"><TrendingUp className="h-4 w-4" /> Twimzi price discovery</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Discover product prices <span className="block bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">from listed suppliers</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Search supplier-listed products, set your budget and explore available prices before contacting a business.</p>
          <form method="get" className="mt-8 grid max-w-5xl gap-3 rounded-2xl border border-white bg-white/90 p-3 shadow-lg shadow-blue-900/5 sm:grid-cols-[minmax(220px,1fr)_140px_140px_170px_auto]">
            <label className="relative block"><span className="sr-only">Search products</span><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={query} placeholder="Product, brand or model" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <label><span className="sr-only">Minimum price</span><input name="min" type="number" min="0" step="0.01" defaultValue={params.min || ""} placeholder="Min ₹" className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <label><span className="sr-only">Maximum price</span><input name="max" type="number" min="0" step="0.01" defaultValue={params.max || ""} placeholder="Max ₹" className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <label><span className="sr-only">Sort prices</span><select name="sort" defaultValue={sort} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"><Search className="h-4 w-4" /> Find prices</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Product prices are temporarily unavailable. Please try again shortly.</div> : <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[{label:"Products with listed prices",value:String(priced.length)},{label:"Lowest listed price",value:lowest === null ? "—" : price(lowest)},{label:"Highest listed price",value:highest === null ? "—" : price(highest)}].map((item)=><div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{item.value}</p></div>)}
          </div>
          <div className="mt-9 flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-slate-500">{filtered.length} matching priced {filtered.length === 1 ? "listing" : "listings"}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Compare available product prices</h2></div><Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">Browse all products <ArrowRight className="h-4 w-4" /></Link></div>
          {filtered.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product)=><PriceCard key={product.id} product={product} />)}</div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"><ArrowDownUp className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 text-lg font-bold text-slate-900">No priced products match these filters</h3><p className="mt-2 text-sm text-slate-500">Try another keyword or widen your price range. Products without a supplier-listed price are not included in price comparisons.</p><Link href="/products/prices" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Clear filters</Link></div>}
          <p className="mt-8 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-slate-600">Price transparency: figures shown here are current prices published by individual suppliers on Twimzi, not verified market averages or historical price trends. Confirm the selling unit, minimum order quantity, taxes, shipping and final quotation directly with the supplier.</p>
          {average !== null ? <p className="mt-2 text-xs text-slate-400">Average of the {priced.length} currently priced public listings: {price(average)}. This is a catalogue statistic, not an industry benchmark.</p> : null}
        </>}
      </section>
    </main>
  );
}
