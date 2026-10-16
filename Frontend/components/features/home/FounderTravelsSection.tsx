import Link from 'next/link';
import { ArrowUpRight, Compass } from 'lucide-react';
import { FOUNDER_JOURNEY } from '@/lib/founderJourney';

export default function FounderTravelsSection() {
  return (
    <section id="founder-travels" aria-labelledby="founder-title" className="scroll-mt-24 bg-[#1B2925] text-[#FAF6F0] px-6 py-20 md:px-12 md:py-28">
      <div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#F2B56B]">Founder Travels</p>
          <h2 id="founder-title" className="font-display font-bold text-4xl md:text-6xl tracking-tight mt-5 leading-tight">We travel with<br />what we build.</h2>
          <p className="font-sans text-white/75 leading-relaxed max-w-lg mt-6">End-to-end support starts with understanding the whole journey. We are putting NaviiGo through the same decisions, detours and practical questions our travellers face.</p>
        </div>
        <div className="border border-white/20 rounded-3xl p-7 md:p-10 bg-white/5">
          <div className="flex items-center justify-between gap-4"><Compass className="h-9 w-9 text-[#F2B56B]" /><span className="text-xs font-mono text-[#F2B56B] uppercase tracking-wider">{FOUNDER_JOURNEY.status}</span></div>
          <p className="text-sm text-white/65 mt-8">{FOUNDER_JOURNEY.occasion} · {FOUNDER_JOURNEY.region}</p>
          <h3 className="font-display text-3xl md:text-4xl font-bold mt-3">{FOUNDER_JOURNEY.title}</h3>
          <p className="text-white/75 leading-relaxed mt-4">The plan before departure. The changes along the way. The lessons we bring back.</p>
          <Link href="/founder-travels" className="inline-flex items-center justify-center gap-3 mt-7 rounded-full bg-[#F2B56B] text-[#1B2925] px-6 py-3 font-semibold min-h-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">See the field-test plan <ArrowUpRight className="h-4 w-4" /></Link>
          <p className="text-xs text-white/55 mt-5">The visit is upcoming. Travel observations and expenses have not been published yet.</p>
        </div>
      </div>
    </section>
  );
}
