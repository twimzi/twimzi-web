import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LegalDocument = {
  id: string;
  document_code: string;
  title: string;
  document_type: string;
  version: string;
  language_code: string;
  content: string;
  summary: string | null;
  effective_from: string | null;
  updated_at: string;
};

type LegalDocumentPageProps = {
  documentType: string;
  title?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function renderContent(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={`space-${index}`} className="h-3" />;
    }

    if (/^#{1,2}\s/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,2}\s+/, "");

      return (
        <h2
          key={index}
          className="mt-8 mb-3 text-xl font-semibold tracking-tight text-slate-900 first:mt-0"
        >
          {heading}
        </h2>
      );
    }

    if (/^###\s/.test(trimmed)) {
      const heading = trimmed.replace(/^###\s+/, "");

      return (
        <h3
          key={index}
          className="mt-6 mb-2 text-lg font-semibold text-slate-900"
        >
          {heading}
        </h3>
      );
    }

    if (/^[-*]\s/.test(trimmed)) {
      return (
        <li
          key={index}
          className="ml-5 list-disc pl-1 leading-7 text-slate-700"
        >
          {trimmed.replace(/^[-*]\s+/, "")}
        </li>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li
          key={index}
          className="ml-5 list-decimal pl-1 leading-7 text-slate-700"
        >
          {trimmed.replace(/^\d+\.\s+/, "")}
        </li>
      );
    }

    return (
      <p key={index} className="leading-7 text-slate-700">
        {trimmed}
      </p>
    );
  });
}

export default async function LegalDocumentPage({
  documentType,
  title,
}: LegalDocumentPageProps) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_active_legal_document", {
    p_document_type: documentType,
    p_language_code: "en",
  });

  const document = (data?.[0] ?? null) as LegalDocument | null;

  if (error || !document) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-500">
              Twimzi Legal
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title ?? "Legal Document"}
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              This document is currently unavailable for public access. Please
              check back later.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Twimzi
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const effectiveDate = formatDate(document.effective_from);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to Twimzi
          </Link>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Twimzi Legal
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {document.title}
            </h1>

            {document.summary && (
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {document.summary}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>Version {document.version}</span>

              {effectiveDate && <span>Effective {effectiveDate}</span>}

              <span>Document {document.document_code}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-1">{renderContent(document.content)}</div>
        </article>
      </section>
    </main>
  );
}