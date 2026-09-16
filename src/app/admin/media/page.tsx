import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type MediaItem = {
  id: string;
  uploaded_by: string | null;
  bucket_name: string | null;
  object_path: string;
  file_name: string | null;
  original_name: string | null;
  mime_type: string | null;
  extension: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt_text: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

export default async function AdminMedia({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const type = params.type?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc("is_super_admin");

  if (adminError || !isAdmin) {
    redirect("/");
  }

  const { data, error } = await supabase.rpc(
    "admin_get_media",
    {
      p_search: search || null,
      p_mime_type: type || null,
      p_limit: 100,
      p_offset: 0,
    },
  );

  const media = (data ?? []) as MediaItem[];

  const imageCount = media.filter(
    (item) => item.mime_type?.startsWith("image/"),
  ).length;

  const videoCount = media.filter(
    (item) => item.mime_type?.startsWith("video/"),
  ).length;

  const publicCount = media.filter(
    (item) => item.is_public,
  ).length;

  const totalSize = media.reduce(
    (total, item) => total + (item.file_size ?? 0),
    0,
  );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Platform
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Media
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage platform media metadata and storage objects.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search file, name or object path..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

          <select
            name="type"
            defaultValue={type}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All media</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="audio/">Audio</option>
            <option value="application/">Documents</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total"
          value={media.length.toLocaleString("en-IN")}
        />

        <StatCard
          label="Images"
          value={imageCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="Videos"
          value={videoCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="Storage"
          value={formatBytes(totalSize)}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load media.
          </p>

          <p className="mt-1">
            Verify that the secure admin media RPC migration has
            been installed and that the current account is a
            SUPER_ADMIN.
          </p>

          <p className="mt-2 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b bg-[var(--color-surface)] px-5 py-4">
            <div>
              <p className="font-bold text-slate-900">
                Media Library
              </p>

              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {publicCount} public media item
                {publicCount === 1 ? "" : "s"} in the current
                result.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Up to 100 results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-4 font-bold">
                    File
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Type
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Size
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Dimensions
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Visibility
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Bucket
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Object Path
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Uploaded By
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {media.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <p className="font-semibold text-slate-700">
                        No media found
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Try changing your search or media type
                        filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  media.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="max-w-[280px] truncate font-bold text-slate-900">
                          {item.original_name ||
                            item.file_name ||
                            "Unnamed file"}
                        </p>

                        {item.file_name &&
                        item.original_name &&
                        item.file_name !==
                          item.original_name ? (
                          <p className="mt-1 max-w-[280px] truncate text-xs text-[var(--color-text-muted)]">
                            Stored: {item.file_name}
                          </p>
                        ) : null}

                        <p className="mt-1 text-[10px] text-slate-400">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {item.mime_type || "Unknown"}
                          </span>

                          {item.extension ? (
                            <span className="text-xs uppercase text-slate-400">
                              {item.extension.replace(".", "")}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatBytes(item.file_size)}
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDimensions(
                          item.width,
                          item.height,
                        )}

                        {item.duration_seconds !== null ? (
                          <span className="mt-1 block">
                            {formatDuration(
                              item.duration_seconds,
                            )}
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            item.is_public
                              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                              : "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                          }
                        >
                          {item.is_public
                            ? "Public"
                            : "Private"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-700">
                          {item.bucket_name || "â€”"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[360px] break-all font-mono text-xs text-slate-600">
                          {item.object_path}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {item.uploaded_by ? (
                          <Link
                            href={`/admin/users?q=${encodeURIComponent(
                              item.uploaded_by,
                            )}`}
                            className="font-mono text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {item.uploaded_by}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">
                            System
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {media.length > 0 ? (
            <div className="border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              Showing the newest {media.length} media item
              {media.length === 1 ? "" : "s"}.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function formatBytes(value: number | null) {
  if (!value || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );

  const size = value / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDimensions(
  width: number | null,
  height: number | null,
) {
  if (width && height) {
    return `${width} Ã— ${height}`;
  }

  return "â€”";
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
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
