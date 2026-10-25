"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, ImagePlus, FileText } from "lucide-react";
import CommunityStoryUploader from "@/components/community/community-story-uploader";

export default function CommunityCreateAction() {
  const [open, setOpen] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setShowStoryForm(false); setOpen(true); }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1879FD] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        <Plus className="h-4 w-4" />
        Add Post / Story
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-create-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close create options"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pr-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1879FD]">Share with your community</p>
              <h2 id="community-create-title" className="mt-1 text-2xl font-bold text-slate-950">Create something</h2>
              <p className="mt-2 text-sm text-slate-600">Add a short-lived story or publish a community post for your business.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setShowStoryForm(true)} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1879FD]"><ImagePlus className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold text-slate-900">Add a story</span><span className="mt-0.5 block text-xs text-slate-600">Visible for 24 hours</span></span>
              </button>
              <Link href="/businesses/dashboard/posts" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><FileText className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold text-slate-900">Create a post</span><span className="mt-0.5 block text-xs text-slate-600">Business update or announcement</span></span>
              </Link>
            </div>

            {showStoryForm && (
              <div id="add-community-story" className="mt-5 border-t border-slate-100 pt-5">
                <CommunityStoryUploader />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
