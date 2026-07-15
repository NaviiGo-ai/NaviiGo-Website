// loading.tsx — Explore [destId] deep-dive skeleton
export default function DestinationLoading() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-16 animate-pulse">
      {/* Hero banner */}
      <div className="h-72 w-full bg-zinc-800 mb-10" />

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Title row */}
        <div className="space-y-3">
          <div className="h-10 w-64 bg-zinc-800 rounded-2xl" />
          <div className="h-4 w-80 bg-zinc-700 rounded-full" />
        </div>

        {/* Selector pills */}
        <div className="flex gap-3 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-28 bg-zinc-800 rounded-full" />
          ))}
        </div>

        {/* Content blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-6 space-y-3">
              <div className="h-5 w-40 bg-zinc-800 rounded-lg" />
              <div className="h-4 w-full bg-zinc-700 rounded-lg" />
              <div className="h-4 w-5/6 bg-zinc-700 rounded-lg" />
              <div className="h-4 w-4/6 bg-zinc-700 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Events row */}
        <div className="space-y-3">
          <div className="h-6 w-36 bg-zinc-800 rounded-xl" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-64 h-40 bg-zinc-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
