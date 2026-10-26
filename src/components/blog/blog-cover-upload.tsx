"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BlogCoverUploadProps = {
  initialValue?: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export default function BlogCoverUpload({ initialValue = "" }: BlogCoverUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadCover(file?: File) {
    setMessage("");
    setError("");
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WebP or AVIF image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
      };
      const filePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extensionByType[file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from("blog-covers")
        .upload(filePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("blog-covers").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      setMessage("Cover uploaded. Save the blog post to apply it.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload the cover image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-2 space-y-3">
      <input type="hidden" name="featured_image_url" value={imageUrl} />
      {imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Blog cover preview" className="aspect-[16/9] max-h-72 w-full object-cover" />
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="max-w-full break-all text-xs text-[var(--color-text-muted)]">Cover image selected</span>
            <button type="button" onClick={() => { setImageUrl(""); setMessage(""); setError(""); }} className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold">Remove cover</button>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[16/9] max-h-56 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-slate-50 px-5 text-center text-sm text-[var(--color-text-muted)]">
          No cover selected. Upload a landscape image to preview it here.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={uploading}
          onChange={(event) => void uploadCover(event.target.files?.[0])}
          className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100 sm:max-w-md"
        />
        {uploading ? <span className="text-sm font-semibold text-blue-700">Uploading cover…</span> : null}
      </div>
      <p className="text-xs leading-5 text-[var(--color-text-muted)]">JPG, PNG, WebP or AVIF · Maximum 5 MB. Public readers can view published covers. Uploads are restricted to super admins.</p>
      {message ? <p role="status" className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
