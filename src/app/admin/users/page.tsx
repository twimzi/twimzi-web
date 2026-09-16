import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  created_at: string | null;
};

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase.rpc("is_super_admin");

  if (error || data !== true) {
    throw new Error("Forbidden");
  }

  return supabase;
}

async function updateUserStatus(formData: FormData) {
  "use server";

  const userId = String(formData.get("user_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!userId) {
    return;
  }

  const supabase = await requireSuperAdmin();

  const { error } = await supabase.rpc("admin_set_user_active", {
    p_profile_id: userId,
    p_is_active: active,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

function formatDate(value: string | null) {
  if (!value) return "â€”";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "suspended":
      return "border-red-200 bg-red-50 text-red-700";

    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await requireSuperAdmin();

  const { data, error } = await supabase.rpc("admin_get_users", {
    p_search: search || null,
    p_limit: 100,
    p_offset: 0,
  });

  const users = (data ?? []) as User[];

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            User Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Users
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage Twimzi user accounts securely from Supabase.
          </p>
        </div>

        <form method="get" className="flex w-full gap-2 lg:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search users..."
            className="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] sm:w-80"
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load users.
          <div className="mt-1 text-xs opacity-80">{error.message}</div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Loaded" value={users.length} />

            <StatCard
              label="Businesses"
              value={users.filter((user) => user.is_business).length}
            />

            <StatCard
              label="Verified"
              value={users.filter((user) => user.is_verified).length}
            />

            <StatCard
              label="Active"
              value={users.filter((user) => user.is_active).length}
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-extrabold">User Accounts</h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing up to 100 users.
                  {search ? ` Search: "${search}"` : ""}
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold">
                {users.length}
              </span>
            </div>

            {users.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-bold">No users found</p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {search
                    ? "Try another search."
                    : "There are currently no users to display."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left text-sm">
                  <thead className="border-b bg-[var(--color-surface)]">
                    <tr>
                      {[
                        "User",
                        "Contact",
                        "Location",
                        "Business",
                        "Verified",
                        "Status",
                        "Joined",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 font-bold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => {
                      const displayName =
                        user.full_name ||
                        user.username ||
                        "Unnamed user";

                      return (
                        <tr
                          key={user.id}
                          className="border-b last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1879FD] to-[#8E07FB] text-sm font-extrabold text-white">
                                {displayName
                                  .split(/\s+/)
                                  .map((word) => word[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-bold">{displayName}</p>

                                {user.username ? (
                                  <p className="text-xs text-[var(--color-text-muted)]">
                                    @{user.username}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p>{user.email || "â€”"}</p>

                            {user.phone ? (
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {user.phone}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-4">
                            {user.city || user.state ? (
                              <>
                                <p>{user.city || "â€”"}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  {user.state || user.country || "â€”"}
                                </p>
                              </>
                            ) : (
                              "â€”"
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {user.is_business ? (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                Business
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Customer
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {user.is_verified ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                Verified
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                Unverified
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${getStatusClass(
                                user.account_status,
                              )}`}
                            >
                              {user.account_status || "unknown"}
                            </span>

                            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                              {user.is_active ? "Account active" : "Account inactive"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            <form action={updateUserStatus}>
                              <input
                                type="hidden"
                                name="user_id"
                                value={user.id}
                              />

                              <input
                                type="hidden"
                                name="active"
                                value={user.is_active ? "false" : "true"}
                              />

                              <button
                                type="submit"
                                className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                                  user.is_active
                                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
