"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";

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

type MediaResponse = {
  data: MediaItem[] | null;
  error: { message: string } | null;
};

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDimensions(item: MediaItem) {
  if (!item.width || !item.height) {
    return "—";
  }

  return `${item.width} × ${item.height}`;
}

function getMediaUrl(item: MediaItem) {
  if (!item.object_path || !item.is_public) {
    return null;
  }

  const baseUrl = siteConfig.media.publicUrl.replace(/\/$/, "");

  const objectPath = item.object_path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/media/${objectPath}`;
}

function isImage(item: MediaItem) {
  return Boolean(item.mime_type?.startsWith("image/"));
}

function isVideo(item: MediaItem) {
  return Boolean(item.mime_type?.startsWith("video/"));
}

function isAudio(item: MediaItem) {
  return Boolean(item.mime_type?.startsWith("audio/"));
}

function mediaTypeLabel(item: MediaItem) {
  if (isImage(item)) return "Image";
  if (isVideo(item)) return "Video";
  if (isAudio(item)) return "Audio";
  return "File";
}

function mediaTypeClasses(item: MediaItem) {
  if (isImage(item)) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (isVideo(item)) {
    return "bg-purple-50 text-purple-700 ring-purple-200";
  }

  if (isAudio(item)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getDisplayName(item: MediaItem) {
  return item.original_name || item.file_name || "Untitled media";
}

function getShortPath(path: string) {
  if (path.length <= 70) {
    return path;
  }

  return `${path.slice(0, 34)}…${path.slice(-32)}`;
}

export default function AdminMediaPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [mimeType, setMimeType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setAuthorized(false);
      setMedia([]);
      setLoading(false);
      setErrorMessage("Please sign in to access the media library.");
      return;
    }

    const { data: isSuperAdmin, error: adminError } = await supabase.rpc(
      "is_super_admin",
    );

    if (adminError || !isSuperAdmin) {
      setAuthorized(false);
      setMedia([]);
      setLoading(false);
      setErrorMessage("You do not have permission to access media.");
      return;
    }

    setAuthorized(true);

    const { data, error } = (await supabase.rpc("admin_get_media", {
      p_search: search.trim() || null,
      p_mime_type: mimeType === "all" ? null : mimeType,
      p_limit: 100,
      p_offset: 0,
    })) as MediaResponse;

    if (error) {
      setMedia([]);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMedia(data ?? []);
    setLoading(false);
  }, [mimeType, search, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMedia();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMedia]);

  const stats = useMemo(() => {
    const images = media.filter(isImage).length;
    const videos = media.filter(isVideo).length;
    const audio = media.filter(isAudio).length;
    const publicCount = media.filter((item) => item.is_public).length;
    const totalBytes = media.reduce(
      (total, item) => total + (item.file_size ?? 0),
      0,
    );

    return {
      total: media.length,
      images,
      videos,
      audio,
      publicCount,
      totalBytes,
    };
  }, [media]);

  if (!authorized && !loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              !
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Media Library
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {errorMessage ||
                "You do not have permission to access the media library."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Super Admin
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Media Library
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review uploaded images, videos, audio and other media stored
                through the Twimzi media infrastructure.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total storage represented
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatFileSize(stats.totalBytes)}
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Images" value={stats.images} />
          <StatCard label="Videos" value={stats.videos} />
          <StatCard label="Audio" value={stats.audio} />
          <StatCard label="Public" value={stats.publicCount} />
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div>
              <label
                htmlFor="media-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search media
              </label>

              <input
                id="media-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="File name, path or alt text..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="media-type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Media type
              </label>

              <select
                id="media-type"
                value={mimeType}
                onChange={(event) => setMimeType(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All types</option>
                <option value="image/">Images</option>
                <option value="video/">Videos</option>
                <option value="audio/">Audio</option>
                <option value="application/">Documents</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void loadMedia()}
              disabled={loading}
              className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </section>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </section>
        ) : media.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
              M
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              No media found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              No media matches the current search and filter.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => {
              const mediaUrl = getMediaUrl(item);
              const displayName = getDisplayName(item);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {isImage(item) && mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl}
                        alt={item.alt_text || displayName}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold ring-1 ${mediaTypeClasses(
                            item,
                          )}`}
                        >
                          {mediaTypeLabel(item).slice(0, 1)}
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {mediaTypeLabel(item)}
                        </p>

                        {mediaUrl ? (
                          <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-950"
                          >
                            Open media
                          </a>
                        ) : null}
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${mediaTypeClasses(
                          item,
                        )}`}
                      >
                        {mediaTypeLabel(item)}
                      </span>
                    </div>

                    {item.is_public ? (
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
                        Public
                      </div>
                    ) : (
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur">
                        Private
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="min-w-0">
                      <h2
                        className="truncate text-sm font-semibold text-slate-950"
                        title={displayName}
                      >
                        {displayName}
                      </h2>

                      <p
                        className="mt-1 truncate text-xs text-slate-500"
                        title={item.object_path}
                      >
                        {getShortPath(item.object_path)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <InfoItem
                        label="Size"
                        value={formatFileSize(item.file_size)}
                      />

                      <InfoItem
                        label="Dimensions"
                        value={formatDimensions(item)}
                      />

                      <InfoItem
                        label="Extension"
                        value={item.extension || "—"}
                      />

                      <InfoItem
                        label="Uploaded"
                        value={formatDate(item.created_at)}
                      />
                    </div>

                    {mediaUrl ? (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                      >
                        Open original
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-slate-700" title={value}>
        {value}
      </p>
    </div>
  );
}