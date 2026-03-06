'use client';

import Link from 'next/link';
import HeroSlider from '@/components/features/home/HeroSlider';
import HorizontalScroll from '@/components/features/gsap-scroll/HorizontalScroll';
import Footer from '@/components/shared/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950">
      <HeroSlider />

      <HorizontalScroll />

      {/* Bookings Section */}
      <section id="bookings" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Curated For Your Spiritual Journey
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Experience India like never before. From AI-crafted itineraries to your personal travel logbook, we redefine how you explore.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
             {/* Card 1 */}
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
                  <span className="text-2xl">📜</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Digital Pilgrim Passport</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Collect digital stamps as you visit temples. Complete spiritual circuits to unlock badges and preserve your journey in a digital logbook.
                </p>
              </motion.div>
              
             {/* Card 2 */}
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">AI-Powered Itineraries</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Just share your destination and budget. Our smart engine dynamically generates day-by-day itineraries, including hidden gems and darshan timings.
                </p>
              </motion.div>
              
             {/* Card 3 */}
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                  <span className="text-2xl">🚕</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Universal Booking Hub</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Compare and auto-book the most cost-efficient cabs seamlessly across all available local platforms, ensuring you reach safely.
                </p>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Explore Incredible India
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Discover ancient temples, majestic forts, and spiritual riverfronts.
              </p>
            </div>
            <Link href="/explore" className="hidden md:block px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
              View All Destinations
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Varanasi', img: '1582283925565-d053709d3bdf' },
              { name: 'Rajasthan', img: '1599661502283-a44ea24dfc74' },
              { name: 'Himalayas', img: '1626621341517-bbf3d9990a23' },
              { name: 'Kerala', img: '1593693397690-362cb9666fc2' }
            ].map((place, i) => (
              <Link href="/explore" key={place.name} className="block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-' + place.img + '?auto=format&fit=crop&q=80&w=400&h=600)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-6 z-20">
                    <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">{place.name}</h3>
                    <p className="text-white/80 text-sm">Explore now →</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Saved Section */}
      <section id="saved" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Save Your Sacred Journeys
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Found a temple circuit you want to complete? Save it to your itinerary and we'll keep you updated on the best times and seamless transit options.
            </p>
            <Link href="/saved">
              <button className="mt-8 px-8 py-3 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-500 transition-colors">
                View Saved Routes
              </button>
            </Link>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Guiding Your Path
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Have questions about your spiritual journey or itinerary? Our AI Guide and expert support team are available 24/7 to assist.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/support">
               <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                 Help Center
               </button>
             </Link>
             <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-500 transition-colors">
               Contact Support
             </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
