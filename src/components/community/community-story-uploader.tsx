"use client";

import { ImagePlus, LoaderCircle, Send, Sparkles } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";

type Business = {
  id: string;
  business_name: string;
  business_status: string;
};

export default function CommunityStoryUploader() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          if (!cancelled) setLoading(false);
          return;
        }
        const { data, error: businessError } = await supabase
          .from("businesses")
          .select("id,business_name,business_status")
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });
        if (businessError) throw businessError;
        if (!cancelled) {
          setUserId(user.id);
          const owned = (data ?? []) as Business[];
          setBusinesses(owned);
          const approved = owned.find((business) => business.business_status === "approved");
          setBusinessId((approved ?? owned[0])?.id ?? "");
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load your business profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [supabase]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setSuccess(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(selected.type)) {
      setError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
      event.target.value = "";
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userId) {
      setError("Sign in to publish a business story.");
      return;
    }
    if (!businessId) {
      setError("No active business profile is linked to this signed-in account. Check that you are using the account that owns your business.");
      return;
    }
    if (!file) {
      setError("Choose an image for your story.");
      return;
    }

    setUploading(true);
    try {
      const optimizedFile = await optimizeImageForUpload(file);
      if (optimizedFile.size > 10 * 1024 * 1024) {
        throw new Error("The optimized image exceeds the 10 MB upload limit.");
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Your session has expired. Please sign in again.");

      const formData = new FormData();
      formData.set("business_id", businessId);
      formData.set("kind", "story");
      formData.set("alt_text", caption.trim().slice(0, 500) || "Business story");
      formData.set("file", optimizedFile);

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke("upload-media", { body: formData });
      if (uploadError) throw new Error(uploadError.message || "Image upload failed.");
      if (!uploadData?.success || !uploadData?.media?.id) {
        throw new Error(uploadData?.error || "Image upload failed.");
      }

      const { error: storyError } = await supabase.from("business_stories").insert({
        business_id: businessId,
        profile_id: userId,
        media_id: uploadData.media.id,
        caption: caption.trim() || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });
      if (storyError) throw storyError;

      setFile(null);
      setCaption("");
      const input = document.getElementById("community-story-image") as HTMLInputElement | null;
      if (input) input.value = "";
      setSuccess("Story published. It will be visible in Community and on the homepage for 24 hours.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish your story.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="mb-6 h-24 animate-pulse rounded-2xl bg-slate-100" />;
  if (!userId) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Share a business story</h2><p className="mt-1 text-sm text-slate-600">Sign in with your business account to upload a story.</p></div>
        <Link href="/login?next=%2Fcommunity" className="inline-flex justify-center rounded-xl bg-[#1879FD] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Sign in</Link>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1879FD]"><Sparkles className="h-5 w-5" /></span>
        <div><h2 className="text-lg font-bold text-slate-900">Share a business story</h2><p className="mt-1 text-sm text-slate-600">Upload a photo and it will appear in Community and on the homepage for 24 hours.</p></div>
      </div>

      {businesses.length === 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">No active business is linked to this account.</p>
          <p className="mt-1">If you already added a business, sign in using the account that owns it. Signed-in profile ID: <span className="break-all font-mono text-xs">{userId}</span></p>
          <Link href="/businesses/dashboard" className="mt-3 inline-flex font-semibold underline">Open business dashboard</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {businesses.length > 1 && <label className="block text-sm font-medium text-slate-700">Business<select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">{businesses.map((business) => <option key={business.id} value={business.id}>{business.business_name}{business.business_status !== "approved" ? " (pending approval)" : ""}</option>)}</select></label>}
          <label htmlFor="community-story-image" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-white p-4 hover:bg-blue-50">
            <ImagePlus className="h-6 w-6 text-[#1879FD]" />
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{file?.name ?? "Choose story image"}</span><span className="mt-1 block text-xs text-slate-500">JPEG, PNG, WebP, GIF or AVIF · up to 10 MB</span></span>
            <input id="community-story-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={handleFileChange} className="sr-only" />
          </label>
          {file && <img src={URL.createObjectURL(file)} alt="Story preview" className="max-h-64 w-full rounded-xl bg-slate-100 object-contain" />}
          <label className="block text-sm font-medium text-slate-700">Caption (optional)<textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} rows={2} placeholder="Add a short caption..." className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          {(error || success) && <p role="status" className={error ? "rounded-xl bg-red-50 p-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"}>{error ?? success}</p>}
          <button type="submit" disabled={uploading || !file || !businessId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1879FD] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {uploading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Publishing...</> : <><Send className="h-4 w-4" /> Publish Story</>}
          </button>
        </form>
      )}
    </section>
  );
}
