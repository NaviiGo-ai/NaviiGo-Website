// loading.tsx — Bookings page skeleton
export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 space-y-3">
          <div className="h-10 w-48 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-72 bg-zinc-700 rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-zinc-800 rounded-xl" />
          ))}
        </div>

        {/* Booking cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-6 flex gap-6 items-center">
              <div className="h-16 w-16 bg-zinc-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-52 bg-zinc-800 rounded-lg" />
                <div className="h-4 w-36 bg-zinc-700 rounded-lg" />
                <div className="h-4 w-24 bg-zinc-700 rounded-full" />
              </div>
              <div className="space-y-2 text-right shrink-0">
                <div className="h-6 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-9 w-28 bg-zinc-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
