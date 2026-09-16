import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = {
  id: string;
  role_name: string;
  role_code: string;
  description: string | null;
  is_system: boolean;
  is_default: boolean;
  is_active: boolean;
  permission_count: number;
  user_count: number;
};

export default async function AdminRolesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_roles");

  const roles: Role[] = Array.isArray(data)
    ? data.map((role) => ({
        id: String(role.id),
        role_name: String(role.role_name),
        role_code: String(role.role_code),
        description: role.description
          ? String(role.description)
          : null,
        is_system: Boolean(role.is_system),
        is_default: Boolean(role.is_default),
        is_active: Boolean(role.is_active),
        permission_count: Number(role.permission_count ?? 0),
        user_count: Number(role.user_count ?? 0),
      }))
    : [];

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Users
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Roles & Permissions
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Manage platform roles, access permissions, and role assignments.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load roles. Please verify the admin roles RPC.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Total Roles
          </p>
          <p className="mt-2 text-3xl font-extrabold">{roles.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            System Roles
          </p>
          <p className="mt-2 text-3xl font-extrabold">
            {roles.filter((role) => role.is_system).length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Assigned Users
          </p>
          <p className="mt-2 text-3xl font-extrabold">
            {roles.reduce((total, role) => total + role.user_count, 0)}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="text-lg font-bold">Platform Roles</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Current roles configured in the Twimzi authorization system.
          </p>
        </div>

        {roles.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
            No roles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Code
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Users
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold">{role.role_name}</p>

                      {role.description ? (
                        <p className="mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">
                          {role.description}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-lg bg-[var(--color-secondary)] px-2.5 py-1 font-mono text-xs font-semibold">
                        {role.role_code}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold">
                      {role.permission_count}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold">
                      {role.user_count}
                    </td>

                    <td className="px-6 py-5">
                      {role.is_system ? (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                          System
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Custom
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {role.is_active ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-bold">Security</h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Role data is loaded through a SUPER_ADMIN-protected Supabase RPC.
          System roles remain protected from direct client-side database
          manipulation.
        </p>
      </div>
    </div>
  );
}
