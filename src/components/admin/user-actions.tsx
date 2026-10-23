"use client";

import { useState, useTransition } from "react";

type User = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_business: boolean;
  is_verified: boolean;
  account_status: string | null;
  is_active: boolean;
};

type Props = {
  user: User;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

const ACCOUNT_STATUSES = [
  "active",
  "suspended",
  "blocked",
] as const;

export function UserActions({
  user,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [isBusiness, setIsBusiness] = useState(user.is_business);
  const [isVerified, setIsVerified] = useState(user.is_verified);
  const [accountStatus, setAccountStatus] = useState(user.account_status ?? "active");
  const [isActive, setIsActive] = useState(user.is_active);

  function resetForm() {
    setFullName(user.full_name ?? "");
    setUsername(user.username ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setCity(user.city ?? "");
    setState(user.state ?? "");
    setCountry(user.country ?? "");
    setIsBusiness(user.is_business);
    setIsVerified(user.is_verified);
    setAccountStatus(user.account_status ?? "active");
    setIsActive(user.is_active);
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

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Email must be valid.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_id", user.id);
    formData.append("full_name", fullName.trim());
    formData.append("username", username.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim() || "");
    formData.append("city", city.trim() || "");
    formData.append("state", state.trim() || "");
    formData.append("country", country.trim() || "");
    formData.append("is_business", String(isBusiness));
    formData.append("is_verified", String(isVerified));
    formData.append("account_status", accountStatus);
    formData.append("is_active", String(isActive));

    startTransition(async () => {
      try {
        await onUpdate(formData);
        setEditing(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update user.",
        );
      }
    });
  }

  function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete "${user.full_name || user.username || "this user"}"?\n\nThe user will be soft-deleted and removed from active administration. This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    const formData = new FormData();
    formData.append("profile_id", user.id);

    startTransition(async () => {
      try {
        await onDelete(formData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete user.",
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
            <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    User Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Edit User
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the user details. All fields are optional except name, username, and email.
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

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Full Name"
                    required
                    value={fullName}
                    onChange={setFullName}
                  />

                  <Field
                    label="Username"
                    required
                    value={username}
                    onChange={setUsername}
                  />

                  <Field
                    label="Email"
                    type="email"
                    required
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
                    label="City"
                    value={city}
                    onChange={setCity}
                  />

                  <Field
                    label="State"
                    value={state}
                    onChange={setState}
                  />

                  <Field
                    label="Country"
                    value={country}
                    onChange={setCountry}
                  />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Account Status
                    </label>

                    <select
                      value={accountStatus}
                      onChange={(event) =>
                        setAccountStatus(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    >
                      {ACCOUNT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Toggle
                    label="Verified"
                    checked={isVerified}
                    onChange={setIsVerified}
                  />

                  <Toggle
                    label="Business Account"
                    checked={isBusiness}
                    onChange={setIsBusiness}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
  <Toggle
    label="Account Enabled"
    checked={isActive}
    onChange={setIsActive}
  />
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