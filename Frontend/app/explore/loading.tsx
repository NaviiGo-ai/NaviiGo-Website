// loading.tsx — Explore page skeleton
export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-16 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-5 w-32 bg-muted rounded-full mx-auto" />
          <div className="h-12 w-72 bg-muted rounded-xl mx-auto" />
          <div className="h-4 w-80 bg-muted/70 rounded-full mx-auto" />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-3 justify-center mb-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-full" />
          ))}
        </div>
        {/* Destination cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="h-52 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-36 bg-muted rounded-lg" />
                <div className="h-4 w-full bg-muted/70 rounded-lg" />
                <div className="h-4 w-3/4 bg-muted/70 rounded-lg" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-muted rounded-full" />
                  <div className="h-6 w-16 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
