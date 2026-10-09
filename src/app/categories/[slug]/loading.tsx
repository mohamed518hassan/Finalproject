export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12" aria-busy="true">
      <header className="bg-linear-to-r from-green-600 via-green-500 to-green-400 px-4 py-8 text-white sm:py-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-6 h-5 w-48 rounded bg-white/25" />
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-white/25" />
            <div>
              <div className="h-8 w-56 rounded bg-white/30" />
              <div className="mt-2 h-4 w-64 max-w-full rounded bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      <section
        className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8"
        aria-label="Loading category products"
      >
        <div className="mb-5 h-7 w-64 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
            >
              <div className="aspect-square rounded-lg bg-slate-100" />
              <div className="mt-4 h-3 w-2/5 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
              <div className="mt-5 h-8 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <span className="sr-only" role="status">
          Loading category products...
        </span>
      </section>
    </div>
  );
}
