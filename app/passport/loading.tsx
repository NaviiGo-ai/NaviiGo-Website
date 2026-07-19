// loading.tsx — Passport page skeleton
export default function PassportLoading() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4">
        {/* Passport card */}
        <div className="bg-zinc-900 rounded-3xl p-8 mb-8 flex gap-6 items-center">
          <div className="h-24 w-24 bg-zinc-800 rounded-full shrink-0" />
          <div className="space-y-3">
            <div className="h-6 w-48 bg-zinc-800 rounded-xl" />
            <div className="h-4 w-32 bg-zinc-700 rounded-lg" />
            <div className="flex gap-2 mt-2">
              <div className="h-7 w-20 bg-zinc-800 rounded-full" />
              <div className="h-7 w-20 bg-zinc-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-5 space-y-2">
              <div className="h-8 w-12 bg-zinc-800 rounded-lg" />
              <div className="h-4 w-24 bg-zinc-700 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Stamp grid */}
        <div className="h-6 w-32 bg-zinc-800 rounded-xl mb-4" />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-20 w-20 bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
