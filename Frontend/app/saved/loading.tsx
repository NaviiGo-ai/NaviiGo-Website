// loading.tsx — Saved trips page skeleton
export default function SavedLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-16 animate-pulse">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 space-y-3">
          <div className="h-10 w-40 bg-muted rounded-xl" />
          <div className="h-4 w-56 bg-muted/70 rounded-full" />
        </div>

        {/* Trip cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-3xl overflow-hidden">
              <div className="h-44 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-40 bg-muted rounded-lg" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-muted/70 rounded-lg" />
                  <div className="h-4 w-16 bg-muted/70 rounded-lg" />
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="h-8 flex-1 bg-muted rounded-xl" />
                  <div className="h-8 w-10 bg-muted rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
