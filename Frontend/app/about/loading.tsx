// loading.tsx — About page skeleton
export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="h-12 w-72 bg-zinc-800 rounded-2xl mx-auto" />
          <div className="h-4 w-96 bg-zinc-700 rounded-full mx-auto" />
          <div className="h-4 w-80 bg-zinc-700 rounded-full mx-auto" />
        </div>

        {/* Mission block */}
        <div className="bg-zinc-900 rounded-3xl p-8 space-y-4">
          <div className="h-6 w-40 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-full bg-zinc-700 rounded-lg" />
          <div className="h-4 w-5/6 bg-zinc-700 rounded-lg" />
          <div className="h-4 w-3/4 bg-zinc-700 rounded-lg" />
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-6 text-center space-y-3">
              <div className="h-20 w-20 bg-zinc-800 rounded-full mx-auto" />
              <div className="h-5 w-32 bg-zinc-800 rounded-lg mx-auto" />
              <div className="h-4 w-24 bg-zinc-700 rounded-lg mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
