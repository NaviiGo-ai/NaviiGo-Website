import type { Metadata } from 'next';
import Link from 'next/link';
import { FOUNDER_JOURNEY } from '@/lib/founderJourney';

export const metadata: Metadata = {
  title: 'Founder Travels',
  description: 'Follow NaviiGo’s upcoming founder field test at Kainchi Dham during Diwali 2026. Real journeys, practical observations and lessons for better travel support.',
};

export default function FounderTravelsPage() {
  return (
    <article className="bg-paper-warm text-naviigo-brown px-6 pt-28 pb-20 md:px-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm underline underline-offset-4">Back to NaviiGo</Link>
        <p className="font-mono text-xs uppercase tracking-[0.2em] mt-12 text-naviigo-orange">Founder Travels · {FOUNDER_JOURNEY.status}</p>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-5 leading-tight">Our next journey:<br />{FOUNDER_JOURNEY.title}.</h1>
        <p className="text-lg mt-5">{FOUNDER_JOURNEY.region} · {FOUNDER_JOURNEY.occasion}</p>
        <p className="text-lg leading-relaxed max-w-3xl mt-8">{FOUNDER_JOURNEY.introduction}</p>
        <div className="grid gap-5 md:grid-cols-3 mt-12">
          {FOUNDER_JOURNEY.stages.map((stage, index) => (
            <section key={stage.title} className="border border-naviigo-brown/20 rounded-2xl p-6 bg-white/50">
              <p className="font-mono text-xs text-naviigo-orange uppercase">0{index + 1} · {stage.status}</p>
              <h2 className="font-display text-2xl font-bold mt-4">{stage.title}</h2>
              <p className="mt-4 leading-relaxed">{stage.detail}</p>
            </section>
          ))}
        </div>
        <section className="mt-12 border-t border-naviigo-brown/20 pt-8 max-w-3xl">
          <h2 className="font-display text-2xl font-bold">A journal with context.</h2>
          <p className="mt-4 leading-relaxed">We will distinguish personal observations from information confirmed by a venue or service provider. Each published observation will carry its visit date. Prices, access arrangements and availability can change.</p>
          <p className="mt-4 leading-relaxed">The first trip report will be added after the visit, with the lessons we can put back into NaviiGo.</p>
        </section>
      </div>
    </article>
  );
}
