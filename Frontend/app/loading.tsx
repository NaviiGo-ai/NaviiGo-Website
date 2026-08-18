// loading.tsx — Home page skeleton
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-black animate-pulse">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-[90vh] gap-6 px-4">
        <div className="h-5 w-40 bg-zinc-800 rounded-full" />
        <div className="h-14 w-3/4 max-w-2xl bg-zinc-800 rounded-2xl" />
        <div className="h-14 w-2/3 max-w-xl bg-zinc-700 rounded-2xl" />
        <div className="h-5 w-96 bg-zinc-800 rounded-full" />
        <div className="flex gap-4 mt-4">
          <div className="h-12 w-40 bg-zinc-700 rounded-xl" />
          <div className="h-12 w-36 bg-zinc-800 rounded-xl" />
        </div>
      </div>
      {/* Destination cards row */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="h-8 w-48 bg-zinc-800 rounded-xl mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-zinc-800 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
