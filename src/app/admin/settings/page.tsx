"use client";

import { FormEvent, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Setting = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

const supabase = createSupabaseBrowserClient();

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  async function loadSettings(query = "") {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.rpc(
      "admin_get_settings",
      {
        p_search: query.trim() || null,
        p_limit: 100,
        p_offset: 0,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      setSettings([]);
    } else {
      setSettings((data ?? []) as Setting[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      const { data, error } = await supabase.rpc(
        "admin_get_settings",
        {
          p_search: null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setSettings([]);
      } else {
        setSettings((data ?? []) as Setting[]);
      }

      setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingKey(null);
    setSettingKey("");
    setSettingValue("");
    setDescription("");
    setIsPublic(false);
  }

  function editSetting(setting: Setting) {
    setEditingKey(setting.setting_key);
    setSettingKey(setting.setting_key);
    setSettingValue(setting.setting_value ?? "");
    setDescription(setting.description ?? "");
    setIsPublic(setting.is_public);
    setSuccessMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const key = settingKey.trim();

    if (!key) {
      setErrorMessage("Setting key is required.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.rpc(
      "admin_upsert_setting",
      {
        p_setting_key: key,
        p_setting_value: settingValue,
        p_description: description.trim() || null,
        p_is_public: isPublic,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setSuccessMessage(
      editingKey
        ? "Setting updated successfully."
        : "Setting created successfully.",
    );

    resetForm();

    await loadSettings(search);

    setIsSaving(false);
  }

  async function deleteSetting(setting: Setting) {
    const confirmed = window.confirm(
      `Delete "${setting.setting_key}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase.rpc(
      "admin_delete_setting",
      {
        p_setting_key: setting.setting_key,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      setErrorMessage(
        "Setting was not found or could not be deleted.",
      );
      return;
    }

    if (editingKey === setting.setting_key) {
      resetForm();
    }

    setSuccessMessage("Setting deleted successfully.");

    await loadSettings(search);
  }

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await loadSettings(search);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          System
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Settings
        </h1>

        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Manage secure platform configuration used across Twimzi.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <p className="font-bold">Something went wrong</p>

          <p className="mt-1 break-words">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700"
        >
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <p className="text-lg font-bold text-slate-900">
            {editingKey ? "Edit Setting" : "Add Setting"}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Configuration is protected by the SUPER_ADMIN security
            layer.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="setting-key"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Setting Key
              </label>

              <input
                id="setting-key"
                type="text"
                value={settingKey}
                onChange={(event) =>
                  setSettingKey(event.target.value)
                }
                disabled={Boolean(editingKey)}
                placeholder="example.setting_key"
                maxLength={150}
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:bg-slate-100 disabled:text-slate-500"
              />

              {editingKey ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Setting keys cannot be changed while editing.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="setting-value"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Value
              </label>

              <input
                id="setting-value"
                type="text"
                value={settingValue}
                onChange={(event) =>
                  setSettingValue(event.target.value)
                }
                placeholder="Setting value"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="setting-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="setting-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Explain what this setting controls..."
              rows={3}
              className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) =>
                setIsPublic(event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Public setting
              </span>

              <span className="block text-xs text-[var(--color-text-muted)]">
                Mark this setting as safe for public application
                consumption.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingKey
                  ? "Update Setting"
                  : "Create Setting"}
            </button>

            {editingKey ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              Platform Settings
            </p>

            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {settings.length.toLocaleString("en-IN")} setting
              {settings.length === 1 ? "" : "s"} loaded.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-xl gap-2"
          >
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search settings..."
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            />

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Loading settings...
            </div>
          ) : settings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No settings found
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Create a setting above or change your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="border-b bg-[var(--color-surface)]">
                  <tr>
                    <th className="px-5 py-4 font-bold">
                      Setting
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Value
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Description
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Visibility
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Updated
                    </th>

                    <th className="px-5 py-4 text-right font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {settings.map((setting) => (
                    <tr
                      key={setting.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-bold text-[var(--color-primary)]">
                          {setting.setting_key}
                        </p>
                      </td>

                      <td className="max-w-[280px] px-5 py-4">
                        <p className="break-words text-sm text-slate-700">
                          {setting.setting_value || "â€”"}
                        </p>
                      </td>

                      <td className="max-w-[320px] px-5 py-4">
                        <p className="break-words text-sm text-[var(--color-text-muted)]">
                          {setting.description || "â€”"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {setting.is_public ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Private
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(setting.updated_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editSetting(setting)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deleteSetting(setting)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "â€”";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
