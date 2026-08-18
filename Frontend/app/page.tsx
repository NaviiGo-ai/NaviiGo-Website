'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeroSlider from '@/components/features/home/HeroSlider';
import HorizontalScroll from '@/components/features/gsap-scroll/HorizontalScroll';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/* Data — emojis use JSX dangerouslySetInnerHTML to avoid SSR/client   */
/* hydration mismatches caused by multi-codepoint emoji rendering.     */
/* ------------------------------------------------------------------ */

const stats = [
  { value: '50+', label: 'Destinations', icon: '\u{1F5FA}\uFE0F' },
  { value: '500+', label: 'OTA Partners', icon: '\u2708\uFE0F' },
  { value: '10K+', label: 'Itineraries Created', icon: '\u{1F4CB}' },
  { value: '24/7', label: 'AI Travel Guide', icon: '\u{1F916}' },
];

const fadeUp = {
  hidden: (i: number) => ({ opacity: 0, y: 30, transition: { delay: i * 0.12 } }),
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6 } }),
};

const destinations = [
  { name: 'Varanasi', tag: 'Spiritual Capital', img: '/destinations/varanasi.png' },
  { name: 'Rajasthan', tag: 'Land of Kings', img: '/destinations/jaipur.png' },
  { name: 'Himalayas', tag: 'Peak Serenity', img: '/destinations/manali.png' },
  { name: 'Kerala', tag: "God's Own Country", img: '/destinations/kerala.jpg' },
];

const testimonials = [
  {
    quote: 'NaviiGo planned our entire Char Dham Yatra in under a minute. The AI knew every darshan timing and even suggested local dhabas. Incredible!',
    author: 'Priya Sharma',
    location: 'Delhi \u2192 Char Dham',
    initials: 'PS',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    quote: 'The booking comparison saved us \u20B912,000 on our family trip to Kerala. We found trains, hotels and cabs all in one place.',
    author: 'Rahul Mehta',
    location: 'Mumbai \u2192 Kerala',
    initials: 'RM',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    quote: 'My kids love collecting passport stamps at every temple we visit. It turned our pilgrimage into an adventure they actually enjoy!',
    author: 'Anita Verma',
    location: 'Lucknow \u2192 Varanasi',
    initials: 'AV',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950">
      <HeroSlider />

      <HorizontalScroll />

      {/* ——— Stats Bar ————————————————————————————————————————————————— */}
      <section className="relative z-10 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <span className="text-2xl sm:text-3xl mb-2 block" suppressHydrationWarning>{stat.icon}</span>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Features — Bento Grid ————————————————————————————————————— */}
      <section className="relative z-10 py-12 sm:py-24 px-4 sm:px-6 bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 mb-3 block">Why NaviiGo</span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Everything You Need.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">One Platform.</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Main Feature — Large Card */}
            <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="md:col-span-2 lg:col-span-2 relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6 sm:p-10 min-h-[260px] sm:min-h-[320px] group">
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/10 to-transparent" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-700" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4 sm:mb-6">
                  <span suppressHydrationWarning>{'\u{1F9E0}'}</span> Core Feature
                </div>
                <h3 className="text-xl sm:text-3xl font-bold text-white mb-3">AI-Powered Itineraries</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                  Share your destination, budget &amp; vibe. Our AI builds a complete day-by-day plan with hidden gems, local food spots &amp; darshan timings &mdash; in under 60 seconds.
                </p>
                <Link href="/itinerary?new=true" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all hover:scale-[1.03] shadow-lg shadow-blue-600/20">
                  Plan Your Trip <span className="text-lg">&rarr;</span>
                </Link>
              </div>
            </motion.div>

            {/* Passport Card */}
            <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link href="/passport" className="block h-full">
                <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-950 p-6 sm:p-8 min-h-[260px] group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <span className="text-4xl sm:text-5xl mb-4 block" suppressHydrationWarning>{'\u{1F4DC}'}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Digital Passport</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Collect stamps, earn XP, climb leaderboards. Gamified travel exploration.</p>
                    <span className="inline-flex items-center gap-1 text-sm text-orange-400 mt-4 font-medium">
                      Start Collecting <span className="text-lg">&rarr;</span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Booking Card */}
            <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link href="/bookings" className="block h-full">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 p-6 sm:p-8 min-h-[200px] group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <span className="text-4xl sm:text-5xl mb-4 block" suppressHydrationWarning>{'\u{1F50D}'}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Booking Hub</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Flights, trains, cabs &amp; hotels &mdash; compare across 500+ platforms in one search.</p>
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-400 mt-4 font-medium">
                      Compare Prices <span className="text-lg">&rarr;</span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Explore Card */}
            <motion.div custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link href="/explore" className="block h-full">
                <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-slate-950 p-6 sm:p-8 min-h-[200px] group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <span className="text-4xl sm:text-5xl mb-4 block" suppressHydrationWarning>{'\u{1F30D}'}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Deep Dive Explore</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Browse 50+ destinations with local insights, crowd data &amp; seasonal weather.</p>
                    <span className="inline-flex items-center gap-1 text-sm text-cyan-400 mt-4 font-medium">
                      Explore Now <span className="text-lg">&rarr;</span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Saved / Collection Card */}
            <motion.div custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link href="/saved" className="block h-full">
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 p-6 sm:p-8 min-h-[200px] group hover:scale-[1.02] transition-all duration-300">
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <span className="text-4xl sm:text-5xl mb-4 block" suppressHydrationWarning>{'\u{1F4BE}'}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Your Collection</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Save trips, track progress &amp; get weather/crowd alerts for upcoming journeys.</p>
                    <span className="inline-flex items-center gap-1 text-sm text-amber-400 mt-4 font-medium">
                      View Saved <span className="text-lg">&rarr;</span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ——— Destinations ———————————————————————————————————————————— */}
      <section className="relative z-10 py-12 sm:py-24 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400 mb-3 block">Destinations</span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">Explore Incredible India</h2>
              <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-lg">
                Ancient temples, majestic forts, spiritual riverfronts &mdash; curated with local insights you won&apos;t find in guidebooks.
              </p>
            </div>
            <Link href="/explore" className="shrink-0 px-6 py-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm border border-slate-700">
              View All &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
            {destinations.map((place, i) => (
              <Link href={`/explore/${place.name}`} key={place.name} className="block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative h-64 sm:h-96 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <Image
                    src={place.img}
                    alt={`${place.name} destination`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-4 sm:p-6 z-20">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1 block">{place.tag}</span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white group-hover:translate-x-1 transition-transform">{place.name}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Saved Section ——————————————————————————————————————————— */}
      <section id="saved" className="relative z-10 py-16 sm:py-28 px-4 sm:px-6 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] mix-blend-luminosity" style={{ backgroundImage: "url('/destinations/agra.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400 mb-4 block">Your Collection</span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 sm:mb-6">Save Your Epic Journeys</h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Found a bucket list trip you want to complete? Save it to your itinerary and we&apos;ll keep you updated on the best times, weather, and seamless transit options.
          </p>
          <Link href="/saved" className="inline-block px-8 py-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold hover:bg-orange-500 hover:text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            View Saved Routes &rarr;
          </Link>
        </motion.div>
      </section>

      {/* ——— Support Section ————————————————————————————————————————— */}
      <section id="support" className="relative z-10 py-16 sm:py-28 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-8 text-2xl" suppressHydrationWarning>
              {'\u{1F91D}'}
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 sm:mb-6">Guiding Your Path</h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Have questions about your spiritual journey or itinerary? Our AI Guide and expert support team are available 24/7 to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/support" className="inline-block px-8 py-3.5 rounded-2xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 w-full sm:w-auto text-center">
                Help Center
              </Link>
              <button className="px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all shadow-lg w-full sm:w-auto">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ——— Testimonials ——————————————————————————————————————————— */}
      <section className="relative z-10 py-12 sm:py-24 px-4 sm:px-6 bg-slate-950 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400 mb-3 block">Travelers Love Us</span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">Hear From Our Community</h2>
          </motion.div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible no-scrollbar">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative rounded-2xl sm:rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-5 sm:p-8 flex flex-col min-w-[80vw] sm:min-w-[320px] md:min-w-0 snap-center"
              >
                <div className="absolute top-5 right-5 sm:top-8 sm:right-8 text-4xl sm:text-5xl text-slate-800 font-serif select-none">&ldquo;</div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-xs sm:text-sm">{'\u2605'}</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 relative z-10">{t.quote}</p>
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-800">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.author}</div>
                    <div className="text-xs text-slate-500">{t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Final CTA ——————————————————————————————————————————————— */}
      <section className="relative z-10 py-16 sm:py-28 px-4 sm:px-6 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
            Ready to explore{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              India?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 sm:mb-10">
            Let our AI plan your perfect trip &mdash; from spiritual circuits to hidden gems, booked at the best prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
            <Link href="/itinerary?new=true" className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-semibold text-sm sm:text-base hover:bg-blue-500 transition-all hover:scale-105 shadow-xl shadow-blue-600/20 w-full sm:w-auto text-center">
              Plan Your Trip with AI
            </Link>
            <Link href="/explore" className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-slate-800 text-white font-semibold text-sm sm:text-base hover:bg-slate-700 transition-all border border-slate-700 w-full sm:w-auto text-center">
              Browse Destinations
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
