// loading.tsx — Support page skeleton
export default function SupportLoading() {
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 animate-pulse">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="h-10 w-48 bg-zinc-800 rounded-xl mx-auto" />
          <div className="h-4 w-72 bg-zinc-700 rounded-full mx-auto" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl p-5 space-y-2">
            <div className="h-5 w-64 bg-zinc-800 rounded-lg" />
            <div className="h-4 w-full bg-zinc-700 rounded-lg" />
            <div className="h-4 w-4/5 bg-zinc-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
