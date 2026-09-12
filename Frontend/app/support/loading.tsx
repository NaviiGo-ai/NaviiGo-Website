// loading.tsx — Support page skeleton
export default function SupportLoading() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-16 animate-pulse">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="h-10 w-48 bg-muted rounded-xl mx-auto" />
          <div className="h-4 w-72 bg-muted/70 rounded-full mx-auto" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 space-y-2">
            <div className="h-5 w-64 bg-muted rounded-lg" />
            <div className="h-4 w-full bg-muted/70 rounded-lg" />
            <div className="h-4 w-4/5 bg-muted/70 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
