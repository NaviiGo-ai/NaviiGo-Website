// loading.tsx — About page skeleton
export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="h-12 w-72 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-96 bg-muted/70 rounded-full mx-auto" />
          <div className="h-4 w-80 bg-muted/70 rounded-full mx-auto" />
        </div>

        {/* Mission block */}
        <div className="bg-card rounded-3xl p-8 space-y-4">
          <div className="h-6 w-40 bg-muted rounded-xl" />
          <div className="h-4 w-full bg-muted/70 rounded-lg" />
          <div className="h-4 w-5/6 bg-muted/70 rounded-lg" />
          <div className="h-4 w-3/4 bg-muted/70 rounded-lg" />
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 text-center space-y-3">
              <div className="h-20 w-20 bg-muted rounded-full mx-auto" />
              <div className="h-5 w-32 bg-muted rounded-lg mx-auto" />
              <div className="h-4 w-24 bg-muted/70 rounded-lg mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
