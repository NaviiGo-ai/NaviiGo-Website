// loading.tsx — Itinerary detail (result) page skeleton
export default function ItineraryDetailLoading() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-16 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {/* Title bar */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-xl" />
            <div className="h-4 w-40 bg-zinc-700 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-zinc-800 rounded-xl" />
            <div className="h-10 w-24 bg-zinc-800 rounded-xl" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 flex-1 bg-zinc-800 rounded-2xl" />
          ))}
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-20 bg-zinc-800 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Activity cards */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-5 flex gap-4">
              <div className="h-20 w-20 bg-zinc-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-zinc-800 rounded-lg" />
                <div className="h-4 w-full bg-zinc-700 rounded-lg" />
                <div className="h-4 w-3/4 bg-zinc-700 rounded-lg" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                  <div className="h-6 w-20 bg-zinc-800 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
