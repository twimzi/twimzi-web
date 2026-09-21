"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = {
  id: string;
  role_name: string | null;
  role_code: string | null;
  description: string | null;
  is_system: boolean;
  is_default: boolean;
  is_active: boolean;
  permission_count: number;
  user_count: number;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export default function AdminRolesPage() {
  const supabase = createSupabaseBrowserClient();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = useCallback(async () => {
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

      const { data, error: rolesError } =
        await supabase.rpc("admin_get_roles");

      if (rolesError) {
        throw rolesError;
      }

      setRoles(
        ((data ?? []) as Role[]).map((role) => ({
          ...role,
          permission_count: Number(role.permission_count ?? 0),
          user_count: Number(role.user_count ?? 0),
        })),
      );
    } catch (err) {
      setRoles([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load roles.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoles();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRoles]);

  const statistics = useMemo(() => {
    return {
      total: roles.length,
      active: roles.filter((role) => role.is_active).length,
      system: roles.filter((role) => role.is_system).length,
      defaults: roles.filter((role) => role.is_default).length,
      users: roles.reduce(
        (sum, role) => sum + role.user_count,
        0,
      ),
      permissions: roles.reduce(
        (sum, role) => sum + role.permission_count,
        0,
      ),
    };
  }, [roles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Roles
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review system roles, permissions and assigned users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRoles()}
          disabled={loading}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Roles</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.active}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">System Roles</p>

          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.system}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Default Roles</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statistics.defaults}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Assigned Users</p>

          <p className="mt-2 text-2xl font-semibold text-purple-700">
            {formatNumber(statistics.users)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Permissions</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(statistics.permissions)}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadRoles()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Role Directory
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            System roles are shown first.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              R
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No roles found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are currently no roles available.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Permissions</th>
                    <th className="px-5 py-3">Users</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => (
                    <tr
                      key={role.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-sm px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {role.role_name || "Unnamed role"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {role.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {role.role_code || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {role.is_system && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              System
                            </span>
                          )}

                          {role.is_default && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Default
                            </span>
                          )}

                          {!role.is_system && !role.is_default && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            role.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700">
                          {formatNumber(role.permission_count)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700">
                          {formatNumber(role.user_count)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {roles.map((role) => (
                <div key={role.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {role.role_name || "Unnamed role"}
                      </h3>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {role.role_code || "No role code"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        role.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {role.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {role.description || "No description"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.is_system && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        System
                      </span>
                    )}

                    {role.is_default && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Permissions
                      </p>

                      <p className="mt-1 font-semibold text-slate-700">
                        {formatNumber(role.permission_count)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Assigned Users
                      </p>

                      <p className="mt-1 font-semibold text-slate-700">
                        {formatNumber(role.user_count)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {roles.length} role
              {roles.length === 1 ? "" : "s"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}