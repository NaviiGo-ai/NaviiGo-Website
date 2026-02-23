'use client';

import Link from 'next/link';
import HeroSlider from '@/components/features/home/HeroSlider';
import Footer from '@/components/shared/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950">
      <HeroSlider />
      
      {/* Bookings Section */}
      <section id="bookings" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Find Your Perfect Journey
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Book flights, hotels, and experiences with ease. Our AI-powered engine finds the best deals tailored just for you.
          </p>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
             {/* Dummy Cards */}
             {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                    <span className="text-2xl">✈️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Smart Booking</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Compare prices across hundreds of airlines instantly.
                  </p>
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Explore the World
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Discover hidden gems and popular destinations.
              </p>
            </div>
            <Link href="/explore" className="hidden md:block px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
              View All Destinations
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Kyoto', 'Santorini', 'Machu Picchu', 'Reykjavik'].map((place, i) => (
              <Link href="/explore" key={place} className="block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />
                  {/* Image placeholder - using a generic gradient for now, normally would be an Image component */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(https://source.unsplash.com/random/400x600?sig=${i}&travel)` }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-6 z-20">
                    <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">{place}</h3>
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
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Save Your Dream Trips
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Found something you love? Save it for later and we&apos;ll keep you updated on price drops and availability.
            </p>
            <button className="mt-8 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
              View Saved Items
            </button>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            We&apos;re Here to Help
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Have questions? Our support team is available 24/7 to assist you with your travel plans.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
             <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
               Help Center
             </button>
             <button className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors">
               Contact Support
             </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
