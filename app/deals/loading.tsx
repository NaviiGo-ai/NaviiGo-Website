// loading.tsx — Deals page skeleton (also used standalone)
export default function DealsLoading() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-5 w-48 bg-zinc-800 rounded-full mx-auto" />
          <div className="h-12 w-80 bg-zinc-800 rounded-2xl mx-auto" />
          <div className="h-4 w-96 bg-zinc-700 rounded-full mx-auto" />
        </div>

        {/* Search widget skeleton */}
        <div className="bg-zinc-900 rounded-3xl p-6 mb-8 space-y-4">
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 w-24 bg-zinc-800 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-zinc-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-12 w-48 bg-zinc-700 rounded-2xl" />
        </div>

        {/* Ticket row skeletons */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-5 flex items-center gap-5">
              <div className="h-12 w-12 bg-zinc-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/5 bg-zinc-800 rounded-lg" />
                <div className="h-3 w-1/3 bg-zinc-700 rounded-lg" />
              </div>
              <div className="space-y-2 shrink-0">
                <div className="h-5 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-8 w-20 bg-zinc-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
