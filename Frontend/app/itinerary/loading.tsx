// loading.tsx — Itinerary page skeleton
export default function ItineraryLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-16 animate-pulse">
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-6 w-28 bg-muted rounded-full mx-auto" />
          <div className="h-12 w-96 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-72 bg-muted/70 rounded-full mx-auto" />
        </div>

        {/* Step cards */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center bg-card rounded-2xl p-5">
              <div className="h-12 w-12 bg-muted rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded-lg" />
                <div className="h-3 w-full bg-muted/70 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 h-14 w-56 bg-muted rounded-xl mx-auto" />
      </div>
    </div>
  );
}
