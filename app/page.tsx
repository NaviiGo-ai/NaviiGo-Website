'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeroSlider from '@/components/features/home/HeroSlider';
import HorizontalScroll from '@/components/features/gsap-scroll/HorizontalScroll';
import Footer from '@/components/shared/Footer';
import { motion } from 'framer-motion';

const stats = [
  { value: '50+', label: 'Destinations', icon: '🗺️' },
  { value: '500+', label: 'OTA Partners', icon: '✈️' },
  { value: '10K+', label: 'Itineraries Created', icon: '📋' },
  { value: '24/7', label: 'AI Travel Guide', icon: '🤖' },
];

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Itineraries',
    description: 'Share your destination, budget & vibe. Our AI builds a complete day-by-day plan with hidden gems, local food spots & darshan timings.',
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/20',
    link: '/itinerary',
  },
  {
    icon: '📜',
    title: 'Digital Travel Passport',
    description: 'Collect digital stamps as you explore destinations. Complete bucket lists to unlock badges and build a shareable travel logbook.',
    color: 'from-orange-500/20 to-orange-600/5',
    borderColor: 'border-orange-500/20',
    link: '/passport',
  },
  {
    icon: '🔍',
    title: 'Universal Booking Hub',
    description: 'Compare flights, trains, cabs & hotels across all major platforms in one search. We find the cheapest option so you don\'t have to.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-500/20',
    link: '/bookings',
  },
];

const destinations = [
  { name: 'Varanasi', tag: 'Spiritual Capital', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80' },
  { name: 'Rajasthan', tag: 'Land of Kings', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80' },
  { name: 'Himalayas', tag: 'Peak Serenity', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80' },
  { name: 'Kerala', tag: 'God\'s Own Country', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80' },
];

const testimonials = [
  {
    quote: 'NaviiGo planned our entire Char Dham Yatra in under a minute. The AI knew every darshan timing and even suggested local dhabas. Incredible!',
    author: 'Priya Sharma',
    location: 'Delhi → Char Dham',
    avatar: '👩🏽',
  },
  {
    quote: 'The booking comparison saved us ₹12,000 on our family trip to Kerala. We found trains, hotels and cabs all in one place.',
    author: 'Rahul Mehta',
    location: 'Mumbai → Kerala',
    avatar: '👨🏽',
  },
  {
    quote: 'My kids love collecting passport stamps at every temple we visit. It turned our pilgrimage into an adventure they actually enjoy!',
    author: 'Anita Verma',
    location: 'Lucknow → Varanasi',
    avatar: '👩🏽‍🦱',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950">
      <HeroSlider />

      <HorizontalScroll />

      {/* Stats Bar */}
      <section className="relative z-10 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <span className="text-2xl mb-2 block">{stat.icon}</span>
                <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-28 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 mb-3 block">Why NaviiGo</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Everything You Need.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                One Platform.
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              From AI trip planning to booking aggregation — we handle the logistics so you can focus on the experience.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <Link href={feature.link} className="block h-full">
                  <div className={`relative h-full rounded-2xl border ${feature.borderColor} bg-gradient-to-b ${feature.color} p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/5`}>
                    <span className="text-4xl mb-6 block">{feature.icon}</span>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-blue-400 mt-6 font-medium">
                      Try it now <span className="text-lg">→</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="relative z-10 py-28 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400 mb-3 block">Destinations</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Explore Incredible India
              </h2>
              <p className="mt-3 text-lg text-slate-400 max-w-lg">
                Ancient temples, majestic forts, spiritual riverfronts — curated with local insights you won&apos;t find in guidebooks.
              </p>
            </div>
            <Link href="/explore" className="shrink-0 px-6 py-2.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm border border-slate-700">
              View All →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((place, i) => (
              <Link href={`/explore/${place.name}`} key={place.name} className="block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <Image
                    src={place.img}
                    alt={`${place.name} destination`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-6 z-20">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1 block">{place.tag}</span>
                    <h3 className="text-2xl font-bold text-white group-hover:translate-x-1 transition-transform">{place.name}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Saved Section (Premium Redesign) */}
      <section id="saved" className="relative z-10 py-28 px-6 bg-slate-950 overflow-hidden">
        {/* Background glow & subtle pattern */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80')] bg-cover bg-center opacity-[0.03] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px]" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400 mb-4 block">Your Collection</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Save Your Epic Journeys
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Found a bucket list trip you want to complete? Save it to your itinerary and we'll keep you updated on the best times, weather, and seamless transit options.
          </p>
          <Link href="/saved">
            <button className="px-8 py-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold hover:bg-orange-500 hover:text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              View Saved Routes →
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Support Section (Premium Redesign) */}
      <section id="support" className="relative z-10 py-28 px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-8 text-2xl">
              🤝
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Guiding Your Path
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Have questions about your spiritual journey or itinerary? Our AI Guide and expert support team are available 24/7 to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/support">
                <button className="px-8 py-3.5 rounded-2xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 w-full sm:w-auto">
                  Help Center
                </button>
              </Link>
              <button className="px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all shadow-lg w-full sm:w-auto">
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-28 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400 mb-3 block">Travelers Love Us</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Hear From Our Community
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-8 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-800">
                  <span className="text-2xl">{t.avatar}</span>
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

      {/* CTA Section */}
      <section className="relative z-10 py-28 px-6 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Ready to explore{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              India?
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Let our AI plan your perfect trip — from spiritual circuits to hidden gems, booked at the best prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/itinerary">
              <button className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-500 transition-all hover:scale-105 shadow-xl shadow-blue-600/20">
                Plan Your Trip with AI
              </button>
            </Link>
            <Link href="/explore">
              <button className="px-10 py-4 rounded-2xl bg-slate-800 text-white font-semibold text-base hover:bg-slate-700 transition-all border border-slate-700">
                Browse Destinations
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
