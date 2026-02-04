import HeroExploreShell from '@/components/explore/HeroExploreShell';

export default function ExplorePage() {
  return (
    <main className="space-y-16">
      <HeroExploreShell />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div
          data-reveal
          className="glass-strong rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_90px_rgba(0,0,0,0.18)]"
        >
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Scroll choreography continues below
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Additional content can hook into the same ScrollTrigger scene — this placeholder keeps the hero focused on motion fidelity while remaining SEO-friendly.
          </p>
        </div>
      </section>
    </main>
  );
}
