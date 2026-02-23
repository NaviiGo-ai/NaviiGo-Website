'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Search, Calendar, MapPin, Building2, Ticket } from 'lucide-react';
import Footer from '@/components/shared/Footer';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('flights');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Book Your Next Adventure
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Find the best flights, hotels, and experiences all in one place.
          </p>
        </motion.div>

        {/* Booking Interface Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('flights')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'flights'
                  ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Plane className="w-5 h-5" />
              Flights
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'hotels'
                  ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'experiences'
                  ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Ticket className="w-5 h-5" />
              Experiences
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Flights Form */}
            {activeTab === 'flights' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Leaving from..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Going to..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Departure</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                   <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Return</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Passengers</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white">
                        <option>1 Adult</option>
                        <option>2 Adults</option>
                        <option>2 Adults, 1 Child</option>
                    </select>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Flights
                </button>
              </motion.div>
            )}

            {/* Hotels Form (Simplified) */}
             {activeTab === 'hotels' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Destination</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Where do you want to stay?"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-in</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-out</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                   <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Hotels
                  </button>
              </motion.div>
             )}

             {/* Experiences Form (Simplified) */}
             {activeTab === 'experiences' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                 className="space-y-6"
              >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Where are you going?"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    Find Experiences
                  </button>
              </motion.div>
             )}


          </div>
        </motion.div>

        {/* Recent Searches / Popular */}
        <div className="mt-20">
           <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">Popular Destinations</h2>
           <motion.div 
             variants={container}
             initial="hidden"
             whileInView="show"
             viewport={{ once: true }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
           >
              {[
                { city: 'London', country: 'United Kingdom', price: '$450', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80' },
                { city: 'Tokyo', country: 'Japan', price: '$850', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80' },
                { city: 'New York', country: 'USA', price: '$320', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80' },
                { city: 'Paris', country: 'France', price: '$520', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80' },
                { city: 'Dubai', country: 'UAE', price: '$600', img: 'https://images.unsplash.com/photo-1512453979798-5ea932a88401?auto=format&fit=crop&q=80' },
                { city: 'Sydney', country: 'Australia', price: '$950', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80' },
              ].map((dest, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
                >
                  <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dest.img} alt={dest.city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-xl font-bold text-white">{dest.city}</h3>
                        <p className="text-white/80 text-sm">{dest.country}</p>
                      </div>
                      <span className="text-white font-semibold bg-blue-600/90 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        From {dest.price}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
           </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
