"use client";

import { useState, useTransition } from "react";

type Business = {
  id: string;
  business_code: string | null;
  business_name: string | null;
  legal_name: string | null;
  slug: string | null;
  public_handle: string | null;
  description: string | null;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website: string | null;
  established_year: number | null;
  gst_number: string | null;
  pan_number: string | null;
  business_status: string | null;
  verification_status: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  priority_score: number | null;
};

type Props = {
  business: Business;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

const STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

const VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
] as const;

export function BusinessActions({
  business,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [businessCode, setBusinessCode] = useState(business.business_code ?? "");
  const [businessName, setBusinessName] = useState(business.business_name ?? "");
  const [legalName, setLegalName] = useState(business.legal_name ?? "");
  const [slug, setSlug] = useState(business.slug ?? "");
  const [publicHandle, setPublicHandle] = useState(business.public_handle ?? "");
  const [description, setDescription] = useState(business.description ?? "");
  const [businessType, setBusinessType] = useState(business.business_type ?? "");
  const [email, setEmail] = useState(business.email ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsapp_number ?? "");
  const [website, setWebsite] = useState(business.website ?? "");
  const [establishedYear, setEstablishedYear] = useState(
    business.established_year ? String(business.established_year) : "",
  );
  const [gstNumber, setGstNumber] = useState(business.gst_number ?? "");
  const [panNumber, setPanNumber] = useState(business.pan_number ?? "");
  const [businessStatus, setBusinessStatus] = useState(business.business_status ?? "draft");
  const [verificationStatus, setVerificationStatus] = useState(business.verification_status ?? "unverified");
  const [isActive, setIsActive] = useState(business.is_active);
  const [isFeatured, setIsFeatured] = useState(business.is_featured);
  const [featuredUntil, setFeaturedUntil] = useState(business.featured_until ?? "");
  const [priorityScore, setPriorityScore] = useState(
    business.priority_score ? String(business.priority_score) : "0",
  );

  function resetForm() {
    setBusinessCode(business.business_code ?? "");
    setBusinessName(business.business_name ?? "");
    setLegalName(business.legal_name ?? "");
    setSlug(business.slug ?? "");
    setPublicHandle(business.public_handle ?? "");
    setDescription(business.description ?? "");
    setBusinessType(business.business_type ?? "");
    setEmail(business.email ?? "");
    setPhone(business.phone ?? "");
    setWhatsappNumber(business.whatsapp_number ?? "");
    setWebsite(business.website ?? "");
    setEstablishedYear(business.established_year ? String(business.established_year) : "");
    setGstNumber(business.gst_number ?? "");
    setPanNumber(business.pan_number ?? "");
    setBusinessStatus(business.business_status ?? "draft");
    setVerificationStatus(business.verification_status ?? "unverified");
    setIsActive(business.is_active);
    setIsFeatured(business.is_featured);
    setFeaturedUntil(business.featured_until ?? "");
    setPriorityScore(business.priority_score ? String(business.priority_score) : "0");
    setError("");
  }

  function openEditor() {
    resetForm();
    setEditing(true);
  }

  function closeEditor() {
    if (isPending) return;
    resetForm();
    setEditing(false);
  }

  function handleSave() {
    setError("");

    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    if (!businessCode.trim()) {
      setError("Business code is required.");
      return;
    }

    const parsedEstablishedYear = establishedYear
      ? Number.parseInt(establishedYear, 10)
      : null;
    if (parsedEstablishedYear !== null && (!Number.isFinite(parsedEstablishedYear) || parsedEstablishedYear < 1800 || parsedEstablishedYear > new Date().getFullYear() + 1)) {
      setError("Established year must be a valid year.");
      return;
    }

    const parsedPriorityScore = Number.parseInt(priorityScore || "0", 10);
    if (!Number.isFinite(parsedPriorityScore) || parsedPriorityScore < 0) {
      setError("Priority score must be a valid non-negative number.");
      return;
    }

    const formData = new FormData();
    formData.append("business_id", business.id);
    formData.append("business_code", businessCode.trim());
    formData.append("business_name", businessName.trim());
    formData.append("legal_name", legalName.trim() || "");
    formData.append("slug", slug.trim() || "");
    formData.append("public_handle", publicHandle.trim() || "");
    formData.append("description", description.trim() || "");
    formData.append("business_type", businessType.trim() || "");
    formData.append("email", email.trim() || "");
    formData.append("phone", phone.trim() || "");
    formData.append("whatsapp_number", whatsappNumber.trim() || "");
    formData.append("website", website.trim() || "");
    formData.append("established_year", parsedEstablishedYear ? String(parsedEstablishedYear) : "");
    formData.append("gst_number", gstNumber.trim() || "");
    formData.append("pan_number", panNumber.trim() || "");
    formData.append("business_status", businessStatus);
    formData.append("verification_status", verificationStatus);
    formData.append("is_active", String(isActive));
    formData.append("is_featured", String(isFeatured));
    formData.append("featured_until", featuredUntil || "");
    formData.append("priority_score", String(parsedPriorityScore));

    startTransition(async () => {
      try {
        await onUpdate(formData);
        setEditing(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update business.",
        );
      }
    });
  }

  function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete "${business.business_name || "this business"}"?\n\nThe business will be soft-deleted and removed from active administration. All associated data (products, services, posts) will remain but become inaccessible.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    const formData = new FormData();
    formData.append("business_id", business.id);

    startTransition(async () => {
      try {
        await onDelete(formData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete business.",
        );
        setDeleting(false);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openEditor}
          disabled={isPending}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting || isPending}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && !editing ? (
        <p className="mt-2 max-w-xs text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Business Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Edit Business
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the business details. All fields are optional except name and code.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={isPending}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                {error ? (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Business Name"
                    required
                    value={businessName}
                    onChange={setBusinessName}
                  />

                  <Field
                    label="Business Code"
                    required
                    value={businessCode}
                    onChange={setBusinessCode}
                  />

                  <Field
                    label="Legal Name"
                    value={legalName}
                    onChange={setLegalName}
                  />

                  <Field
                    label="Slug"
                    value={slug}
                    onChange={setSlug}
                    placeholder="auto-generated"
                  />

                  <Field
                    label="Public Handle"
                    value={publicHandle}
                    onChange={setPublicHandle}
                    placeholder="@handle"
                  />

                  <Field
                    label="Business Type"
                    value={businessType}
                    onChange={setBusinessType}
                    placeholder="e.g. restaurant, retail"
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />

                  <Field
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                  />

                  <Field
                    label="WhatsApp Number"
                    type="tel"
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    placeholder="+91xxxxxxxxxx"
                  />

                  <Field
                    label="Website"
                    type="url"
                    value={website}
                    onChange={setWebsite}
                    placeholder="https://example.com"
                  />

                  <Field
                    label="Established Year"
                    type="number"
                    value={establishedYear}
                    onChange={setEstablishedYear}
                    placeholder="2020"
                  />

                  <Field
                    label="GST Number"
                    value={gstNumber}
                    onChange={setGstNumber}
                    placeholder="27AAAAA0000A1Z5"
                  />

                  <Field
                    label="PAN Number"
                    value={panNumber}
                    onChange={setPanNumber}
                    placeholder="AAAAA0000A"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Business description..."
                  />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Business Status
                    </label>

                    <select
                      value={businessStatus}
                      onChange={(event) =>
                        setBusinessStatus(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Verification Status
                    </label>

                    <select
                      value={verificationStatus}
                      onChange={(event) =>
                        setVerificationStatus(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    >
                      {VERIFICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label="Priority Score"
                    type="number"
                    value={priorityScore}
                    onChange={setPriorityScore}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Toggle
                    label="Active"
                    checked={isActive}
                    onChange={setIsActive}
                  />

                  <Toggle
                    label="Featured"
                    checked={isFeatured}
                    onChange={setIsFeatured}
                  />

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Featured Until
                    </label>

                    <input
                      type="datetime-local"
                      value={featuredUntil}
                      onChange={(event) =>
                        setFeaturedUntil(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : null}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
    </label>
  );
}