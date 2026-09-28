"use client";

import {
  ArrowLeft,
  Building2,
  Check,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_code: string | null;
  business_name: string;
  legal_name: string | null;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website: string | null;
  established_year: number | null;
  gst_number: string | null;
  pan_number: string | null;
  verification_status: string | null;
  business_status: string | null;
  public_handle: string | null;
  share_url: string | null;
  profile_completion: number | null;
};

type BusinessForm = {
  business_name: string;
  legal_name: string;
  description: string;
  business_type: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  website: string;
  established_year: string;
  gst_number: string;
  pan_number: string;
  public_handle: string;
};

const BUSINESS_SELECT =
  "id, business_code, business_name, legal_name, slug, description, business_type, email, phone, whatsapp_number, website, established_year, gst_number, pan_number, verification_status, business_status, public_handle, share_url, profile_completion";

function createForm(business: Business): BusinessForm {
  return {
    business_name: business.business_name ?? "",
    legal_name: business.legal_name ?? "",
    description: business.description ?? "",
    business_type: business.business_type ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    whatsapp_number: business.whatsapp_number ?? "",
    website: business.website ?? "",
    established_year:
      business.established_year === null
        ? ""
        : String(business.established_year),
    gst_number: business.gst_number ?? "",
    pan_number: business.pan_number ?? "",
    public_handle: business.public_handle ?? "",
  };
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default function BusinessSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<BusinessForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("Please sign in to manage your business settings.");
        }

        const { data, error: businessError } = await supabase
          .from("businesses")
          .select(BUSINESS_SELECT)
          .eq("owner_profile_id", user.id)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();

        if (businessError) {
          throw businessError;
        }

        if (!data) {
          throw new Error("No business profile was found for your account.");
        }

        if (cancelled) {
          return;
        }

        setBusiness(data);
        setForm(createForm(data));
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load business settings.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBusiness();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof BusinessForm>(
    field: K,
    value: BusinessForm[K],
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business || !form) {
      return;
    }

    if (!form.business_name.trim()) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const establishedYear = form.established_year.trim()
        ? Number(form.established_year.trim())
        : null;

      if (
        establishedYear !== null &&
        (!Number.isInteger(establishedYear) ||
          establishedYear < 1800 ||
          establishedYear > new Date().getFullYear())
      ) {
        throw new Error("Please enter a valid established year.");
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          business_name: form.business_name.trim(),
          legal_name: form.legal_name.trim() || null,
          description: form.description.trim() || null,
          business_type: form.business_type.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp_number: form.whatsapp_number.trim() || null,
          website: form.website.trim()
            ? normalizeUrl(form.website)
            : null,
          established_year: establishedYear,
          gst_number: form.gst_number.trim() || null,
          pan_number: form.pan_number.trim() || null,
          public_handle: form.public_handle.trim() || null,
          updated_by: user.id,
        })
        .eq("id", business.id)
        .eq("owner_profile_id", user.id);

      if (updateError) {
        throw updateError;
      }

      const { data: updatedBusiness, error: reloadError } = await supabase
        .from("businesses")
        .select(BUSINESS_SELECT)
        .eq("id", business.id)
        .eq("owner_profile_id", user.id)
        .is("deleted_at", null)
        .single();

      if (reloadError) {
        throw reloadError;
      }

      setBusiness(updatedBusiness);
      setForm(createForm(updatedBusiness));
      setSuccess("Business settings updated successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update business settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="h-[600px] rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!business || !form) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business profile required
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Create a business profile before opening business settings."}
          </p>

          <Link
            href="/add-business"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Business
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/businesses/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Business Settings
              </h1>

              <p className="text-sm text-slate-600">
                Manage your business information and public profile.
              </p>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="alert"
          >
            {error ? (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{error ?? success}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Profile Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep your public business information accurate and complete.
              </p>
            </div>

            {business.share_url && (
              <a
                href={business.share_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                View Public Profile
              </a>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Business Code
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {business.business_code || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Verification
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                {business.verification_status || "Pending"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Profile Completion
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {business.profile_completion ?? 0}%
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Business Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information customers will see on your profile.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="business_name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Business Name *
                </label>

                <input
                  id="business_name"
                  value={form.business_name}
                  onChange={(event) =>
                    updateField("business_name", event.target.value)
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="legal_name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Legal Name
                </label>

                <input
                  id="legal_name"
                  value={form.legal_name}
                  onChange={(event) =>
                    updateField("legal_name", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="business_type"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Business Type
                </label>

                <input
                  id="business_type"
                  value={form.business_type}
                  onChange={(event) =>
                    updateField("business_type", event.target.value)
                  }
                  placeholder="e.g. Manufacturer, Trader, Professional"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={5}
                  placeholder="Tell customers about your business..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="established_year"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Established Year
                </label>

                <input
                  id="established_year"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={form.established_year}
                  onChange={(event) =>
                    updateField("established_year", event.target.value)
                  }
                  placeholder={String(new Date().getFullYear())}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="public_handle"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Public Handle
                </label>

                <input
                  id="public_handle"
                  value={form.public_handle}
                  onChange={(event) =>
                    updateField("public_handle", event.target.value)
                  }
                  placeholder="your-business"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Used as your public business identity where supported.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Phone className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Contact details customers can use to reach your business.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Business Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="whatsapp_number"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  WhatsApp Number
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="whatsapp_number"
                    type="tel"
                    value={form.whatsapp_number}
                    onChange={(event) =>
                      updateField("whatsapp_number", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Website
                </label>

                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="website"
                    type="text"
                    value={form.website}
                    onChange={(event) =>
                      updateField("website", event.target.value)
                    }
                    placeholder="https://example.com"
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Business Registration
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Optional registration details for your business profile.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="gst_number"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  GST Number
                </label>

                <input
                  id="gst_number"
                  value={form.gst_number}
                  onChange={(event) =>
                    updateField("gst_number", event.target.value)
                  }
                  placeholder="GSTIN"
                  maxLength={15}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="pan_number"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  PAN Number
                </label>

                <input
                  id="pan_number"
                  value={form.pan_number}
                  onChange={(event) =>
                    updateField("pan_number", event.target.value)
                  }
                  placeholder="PAN"
                  maxLength={10}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Location & Other Profile Data
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Address, categories, media, operating hours, and other
                  business-specific information are managed through their
                  respective dashboard modules.
                </p>
              </div>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}