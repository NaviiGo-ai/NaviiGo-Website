import HeroShell from '../components/features/home/HeroShell';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Server component renders markup; GSAP runs only in nested client components. */}
      <HeroShell />

      <section className="glass rounded-3xl p-6 sm:p-10">
        <h2 className="text-pretty text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Naviigo is an aggregation platform.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          No payments. No checkout. When booking is available, you’ll be redirected
          to partners in a new tab.
        </p>
      </section>
    </div>
  );
}
