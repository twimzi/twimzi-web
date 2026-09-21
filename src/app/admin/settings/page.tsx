"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSettingKey(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function AdminSettingsPage() {
  const supabase = createSupabaseBrowserClient();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [sevenDaysAgo] = useState(
    () => Date.now() - 7 * 24 * 60 * 60 * 1000,
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_super_admin");

      if (adminError) {
        throw adminError;
      }

      if (!adminCheck) {
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      const { data, error: settingsError } = await supabase.rpc(
        "admin_get_settings",
        {
          p_search: search.trim() || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (settingsError) {
        throw settingsError;
      }

      setSettings((data ?? []) as Setting[]);
    } catch (err) {
      setSettings([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load settings.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSettings]);

  const statistics = useMemo(() => {
    return {
      total: settings.length,
      public: settings.filter((setting) => setting.is_public).length,
      private: settings.filter((setting) => !setting.is_public).length,
      recentlyUpdated: settings.filter((setting) => {
        const updatedAt = new Date(setting.updated_at).getTime();

        return updatedAt >= sevenDaysAgo;
      }).length,
    };
  }, [settings, sevenDaysAgo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage Twimzi system configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={loading}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Settings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Public</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.public}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Private</p>
          <p className="mt-2 text-2xl font-semibold text-slate-700">
            {statistics.private}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Updated Last 7 Days
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.recentlyUpdated}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="settings-search"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Search settings
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="settings-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by setting key or description..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadSettings()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            System Configuration
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Configuration values are displayed from the protected
            admin settings RPC.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : settings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              S
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No settings found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "There are currently no system settings available."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Setting</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">Visibility</th>
                    <th className="px-5 py-3">Updated</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {settings.map((setting) => {
                    const expanded = expandedId === setting.id;

                    return (
                      <tr
                        key={setting.id}
                        className="align-top transition hover:bg-slate-50"
                      >
                        <td className="max-w-xs px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {formatSettingKey(setting.setting_key)}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {setting.setting_key}
                          </p>

                          {setting.description && (
                            <p className="mt-2 text-sm leading-5 text-slate-500">
                              {setting.description}
                            </p>
                          )}
                        </td>

                        <td className="max-w-md px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                expanded ? null : setting.id,
                              )
                            }
                            className="w-full text-left"
                          >
                            <div
                              className={`rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 ${
                                expanded
                                  ? "whitespace-pre-wrap break-words"
                                  : "truncate"
                              }`}
                            >
                              {setting.setting_value || "—"}
                            </div>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              setting.is_public
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {setting.is_public ? "Public" : "Private"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {formatDateTime(setting.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {settings.map((setting) => {
                const expanded = expandedId === setting.id;

                return (
                  <div key={setting.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {formatSettingKey(setting.setting_key)}
                        </h3>

                        <p className="mt-1 break-all font-mono text-xs text-slate-400">
                          {setting.setting_key}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          setting.is_public
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {setting.is_public ? "Public" : "Private"}
                      </span>
                    </div>

                    {setting.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {setting.description}
                      </p>
                    )}

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Value
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expanded ? null : setting.id,
                          )
                        }
                        className="w-full text-left"
                      >
                        <div
                          className={`rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 ${
                            expanded
                              ? "whitespace-pre-wrap break-words"
                              : "truncate"
                          }`}
                        >
                          {setting.setting_value || "—"}
                        </div>
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      Updated {formatDateTime(setting.updated_at)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {settings.length} setting
              {settings.length === 1 ? "" : "s"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}