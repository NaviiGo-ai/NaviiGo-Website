// loading.tsx — Explore [destId] deep-dive skeleton
export default function DestinationLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 animate-pulse">
      {/* Hero banner */}
      <div className="h-72 w-full bg-muted mb-10" />

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Title row */}
        <div className="space-y-3">
          <div className="h-10 w-64 bg-muted rounded-2xl" />
          <div className="h-4 w-80 bg-muted/70 rounded-full" />
        </div>

        {/* Selector pills */}
        <div className="flex gap-3 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-28 bg-muted rounded-full" />
          ))}
        </div>

        {/* Content blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 space-y-3">
              <div className="h-5 w-40 bg-muted rounded-lg" />
              <div className="h-4 w-full bg-muted/70 rounded-lg" />
              <div className="h-4 w-5/6 bg-muted/70 rounded-lg" />
              <div className="h-4 w-4/6 bg-muted/70 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Events row */}
        <div className="space-y-3">
          <div className="h-6 w-36 bg-muted rounded-xl" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-64 h-40 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
