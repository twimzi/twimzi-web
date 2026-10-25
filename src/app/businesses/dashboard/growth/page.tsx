"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Package,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wrench,
  FileText,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  business_type: string | null;
  description: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website: string | null;
  established_year: number | null;
  verification_status: string | null;
  business_status: string | null;
  profile_completion: number | null;
  created_at: string;
};

type Counts = {
  products: number;
  services: number;
  posts: number;
};

type ChecklistItem = {
  label: string;
  points: number;
  complete: boolean;
  tip: string;
};

const SITE_URL = "https://www.twimzi.com";

function normalizeWebsite(value: string | null) {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent foundation";
  if (score >= 65) return "Good progress";
  if (score >= 40) return "Room to improve";
  return "Let's build your profile";
}

export default function BusinessGrowthCenterPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [business, setBusiness] = useState<Business | null>(null);
  const [counts, setCounts] = useState<Counts>({ products: 0, services: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Please sign in to open your Share My Business.");

        const { data, error: businessError } = await supabase
          .from("businesses")
          .select(
            "id,business_name,slug,business_type,description,phone,whatsapp_number,website,established_year,verification_status,business_status,profile_completion,created_at",
          )
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (businessError) throw businessError;
        if (!data) throw new Error("No active business profile was found for your account.");

        const [productsResult, servicesResult, postsResult] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("business_id", data.id)
            .eq("is_active", true)
            .is("deleted_at", null),
          supabase
            .from("services")
            .select("id", { count: "exact", head: true })
            .eq("business_id", data.id)
            .eq("is_active", true)
            .is("deleted_at", null),
          supabase
            .from("business_posts")
            .select("id", { count: "exact", head: true })
            .eq("business_id", data.id)
            .eq("is_active", true)
            .is("deleted_at", null),
        ]);

        if (productsResult.error) throw productsResult.error;
        if (servicesResult.error) throw servicesResult.error;
        if (postsResult.error) throw postsResult.error;

        if (!cancelled) {
          setBusiness(data as Business);
          setCounts({
            products: productsResult.count ?? 0,
            services: servicesResult.count ?? 0,
            posts: postsResult.count ?? 0,
          });
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load your business profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const profileUrl = business
    ? `${SITE_URL}/businesses/${business.slug || business.id}`
    : "";

  const checklist: ChecklistItem[] = business
    ? [
        {
          label: "Business name",
          points: 15,
          complete: Boolean(business.business_name.trim()),
          tip: "Keep your official business name clear and consistent.",
        },
        {
          label: "Business type",
          points: 10,
          complete: Boolean(business.business_type?.trim()),
          tip: "Use the most accurate business type.",
        },
        {
          label: "Business description",
          points: 20,
          complete: Boolean(business.description?.trim() && business.description.trim().length >= 40),
          tip: "Add a useful description of what you offer and who you serve.",
        },
        {
          label: "Phone or WhatsApp",
          points: 15,
          complete: Boolean(business.phone?.trim() || business.whatsapp_number?.trim()),
          tip: "Add at least one contact method customers can use.",
        },
        {
          label: "Website",
          points: 10,
          complete: Boolean(business.website?.trim()),
          tip: "Add your website if you have one.",
        },
        {
          label: "Established year",
          points: 5,
          complete: Boolean(business.established_year && business.established_year >= 1800 && business.established_year <= new Date().getFullYear()),
          tip: "Add the year your business started, if known.",
        },
        {
          label: "Products or services",
          points: 15,
          complete: counts.products > 0 || counts.services > 0,
          tip: "Add at least one active product or service that your business offers.",
        },
        {
          label: "Community updates",
          points: 10,
          complete: counts.posts > 0,
          tip: "Publish a useful business update or offer to keep your profile fresh.",
        },
      ]
    : [];

  const healthScore = checklist.reduce((total, item) => total + (item.complete ? item.points : 0), 0);
  const verificationStatus = business?.verification_status?.toLowerCase() ?? "unverified";
  const businessStatus = business?.business_status?.toLowerCase() ?? "draft";
  const verified = verificationStatus === "verified" && businessStatus === "approved";
  const trustLabel = verified
    ? "Twimzi Verified"
    : verificationStatus === "pending"
      ? "Verification Pending"
      : verificationStatus === "rejected"
        ? "Verification Rejected"
        : "Not Verified";
  const trustHelp = verified
    ? "Twimzi verification has been approved for this business."
    : verificationStatus === "pending"
      ? "Your verification request is awaiting review. This is not a negative trust finding."
      : verificationStatus === "rejected"
        ? "The verification request was not approved. Check your dashboard for next steps; this does not by itself mean the business is fraudulent."
        : "This business has no approved Twimzi verification. Not verified does not mean suspicious.";
  const websiteUrl = normalizeWebsite(business?.website ?? null);

  async function copyProfileLink() {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setNotice("Business profile link copied.");
    } catch {
      setNotice("Copy was blocked by your browser. Select and copy the profile link below.");
    }
  }

  function downloadQr() {
    const svg = document.getElementById("twimzi-business-qr");
    if (!(svg instanceof SVGSVGElement)) {
      setNotice("QR code is not ready yet.");
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${(business?.slug || business?.id || "twimzi-business").replace(/[^a-z0-9-_]/gi, "-")}-qr.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice("QR code downloaded as SVG.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-12 rounded-2xl bg-[var(--color-border-light)]" />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-72 rounded-2xl bg-[var(--color-border-light)] lg:col-span-2" />
            <div className="h-72 rounded-2xl bg-[var(--color-border-light)]" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-[var(--color-primary)]" />
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text)]">Share My Business</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{error || "Business profile unavailable."}</p>
          <Link href="/businesses/dashboard" className="mt-6 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/businesses/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <ArrowLeft className="h-4 w-4" /> Business Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">Share My Business</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Share your public business profile with customers, copy your link, and download a QR code for your shop, packaging, invoices or social media.
            </p>
          </div>
          <Link href="/businesses/dashboard/settings" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
            Edit Business
          </Link>
        </div>

        {notice && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="font-semibold text-[var(--color-primary)]">Dismiss</button>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs font-semibold">Twimzi Business Passport</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${verified ? "bg-emerald-50 text-emerald-700" : verificationStatus === "rejected" ? "bg-rose-50 text-rose-700" : verificationStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                    {verified ? <BadgeCheck className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {trustLabel}
                  </span>
                </div>
                <h2 className="mt-3 break-words text-2xl font-bold text-[var(--color-text)]">{business.business_name}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{business.business_type || "Business"}{business.established_year ? ` · Established ${business.established_year}` : ""}</p>
                {business.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p>}
                <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">{trustHelp}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--color-background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Public profile link</p>
              <p className="mt-2 break-all text-sm font-medium text-[var(--color-text)]">{profileUrl}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyProfileLink()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                  <Copy className="h-4 w-4" /> Copy link
                </button>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]">
                  <ExternalLink className="h-4 w-4" /> Open profile
                </a>
                {websiteUrl && (
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]">
                    <Globe className="h-4 w-4" /> Business website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
              <QrCode className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-[var(--color-text)]">Your Business QR</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Print it on cards, packaging, invoices or your shop counter.</p>
            <div className="mx-auto mt-5 flex max-w-[240px] justify-center rounded-2xl border border-[var(--color-border)] bg-white p-3">
              <QRCodeSVG id="twimzi-business-qr" value={profileUrl} size={210} level="H" includeMargin />
            </div>
            <button type="button" onClick={downloadQr} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white">
              <Download className="h-4 w-4" /> Download QR (SVG)
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">Generated on your device; no external QR API is called.</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">Business Health Score</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">A rule-based readiness score, not a customer rating.</p>
              </div>
            </div>
            <div className="mt-7 flex items-end gap-3">
              <span className="text-6xl font-bold tracking-tight text-[var(--color-text)]">{healthScore}</span>
              <span className="pb-2 text-sm text-[var(--color-text-secondary)]">/ 100</span>
            </div>
            <p className="mt-1 font-semibold text-[var(--color-primary-dark)]">{scoreLabel(healthScore)}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-primary-light)]">
              <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${healthScore}%` }} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[var(--color-background)] p-3 text-center">
                <Package className="mx-auto h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-2 text-xl font-bold text-[var(--color-text)]">{counts.products}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Products</p>
              </div>
              <div className="rounded-xl bg-[var(--color-background)] p-3 text-center">
                <Wrench className="mx-auto h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-2 text-xl font-bold text-[var(--color-text)]">{counts.services}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Services</p>
              </div>
              <div className="rounded-xl bg-[var(--color-background)] p-3 text-center">
                <FileText className="mx-auto h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-2 text-xl font-bold text-[var(--color-text)]">{counts.posts}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Updates</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">Your improvement checklist</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Complete these steps to strengthen your business presence.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] p-4">
                  {item.complete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-secondary)]">{item.points}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-text)]">{item.label}</p>
                    {!item.complete && <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">{item.tip}</p>}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary)]">{item.complete ? "Done" : `+${item.points}`}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/businesses/dashboard/settings" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white">
                Edit profile <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/businesses/dashboard/products" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                Manage products
              </Link>
              <Link href="/businesses/dashboard/services" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                Manage services
              </Link>
            </div>
          </div>
        </section>

        <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
          Health Score disclosure: this private owner-facing checklist measures profile readiness, not business legitimacy, customer satisfaction, or quality. Verification is a separate status and does not add points to the score. “Twimzi Verified” appears only when the stored verification status is verified and the business status is approved. Product/service counts include active, non-deleted records; community updates are counted from active, non-deleted posts. These are initial product rules and should be reviewed against real owner feedback before being treated as a benchmark.
        </p>
      </div>
    </main>
  );
}
