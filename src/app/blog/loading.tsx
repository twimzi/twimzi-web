export default function BlogLoading() {
  return (
    <main className="min-h-screen bg-[#f5f5f2]" aria-label="Loading blog articles">
      <section className="border-b border-slate-200 bg-[#f0f2f2]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-10 max-w-2xl animate-pulse rounded bg-slate-200 sm:h-14" />
          <div className="mt-4 h-5 max-w-xl animate-pulse rounded bg-slate-200" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <article key={item} className="overflow-hidden rounded-xl border border-slate-200 bg-[#fbfbf8]">
              <div className="aspect-[16/9] animate-pulse bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
