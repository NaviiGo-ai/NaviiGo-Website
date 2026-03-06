'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { X, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

type BadgeType = {
  name: string;
  location: string;
  unlocked: boolean;
  icon: string;
  type: string;
  visitedDate?: string;
  activities?: string[];
  reason?: string;
};

const badges: BadgeType[] = [
  { 
    name: 'Kashi Vishwanath', 
    location: 'Varanasi', 
    unlocked: true, 
    icon: '🕉️',
    type: 'Spiritual',
    visitedDate: 'Aug 14, 2025',
    activities: ['Ganga Aarti at Dashashwamedh Ghat', 'Temple Darshan', 'Boat Ride'],
    reason: 'Verified via GPS check-in at temple premises & authorized partner scanning.'
  },
  { 
    name: 'Eiffel Tower', 
    location: 'Paris, France', 
    unlocked: true, 
    icon: '🗼',
    type: 'City Landmark',
    visitedDate: 'Sep 22, 2025',
    activities: ['Summit Access', 'Seine River Cruise', 'Louvre Museum Visit'],
    reason: 'Cross-referenced with booked flight tickets and multi-day GPS activity.'
  },
  { 
    name: 'Meenakshi Temple', 
    location: 'Madurai', 
    unlocked: true, 
    icon: '🛕',
    type: 'Spiritual',
    visitedDate: 'Oct 05, 2025',
    activities: ['Guided Architecture Tour', 'Evening Ceremony'],
    reason: 'Verified through registered local guide check-in.'
  },
  { 
    name: 'Mount Fuji', 
    location: 'Honshu, Japan', 
    unlocked: false, 
    icon: '🗻',
    type: 'Adventure',
  },
  { 
    name: 'Times Square', 
    location: 'New York City', 
    unlocked: false, 
    icon: '🗽',
    type: 'City Life',
  },
  { 
    name: 'Kedarnath Trek', 
    location: 'Uttarakhand', 
    unlocked: false, 
    icon: '🏔️',
    type: 'Adventure/Spiritual',
  },
  { 
    name: 'Tirupati Balaji', 
    location: 'Tamil Nadu', 
    unlocked: false, 
    icon: '🛕',
    type: 'Spiritual',
  },
  { 
    name: 'Colosseum', 
    location: 'Rome, Italy', 
    unlocked: false, 
    icon: '🏛️',
    type: 'History',
  },
];

export default function PassportPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.stamp', { scale: 0, opacity: 0, rotation: -45, stagger: 0.1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen relative bg-zinc-50 dark:bg-black pt-32 pb-24 px-6 md:px-12 overflow-hidden">
      {/* Decorative WebGL-like blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-slate-900 dark:text-white">
            Digital Travel <span className="italic font-serif text-orange-500">Passport</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Your journeys immortalized. Visit iconic cities, complete treks, explore historic monuments, and collect digital stamps verified by your actions and locations.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {badges.map((stamp, i) => (
              <motion.div 
                key={i} 
                onClick={() => stamp.unlocked && setSelectedBadge(stamp)}
                whileHover={stamp.unlocked ? { scale: 1.05, y: -5 } : {}}
                whileTap={stamp.unlocked ? { scale: 0.95 } : {}}
                className={`stamp flex flex-col justify-center items-center p-8 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl relative ${stamp.unlocked ? 'cursor-pointer hover:shadow-xl hover:shadow-orange-500/10 transition-shadow' : 'opacity-70 grayscale-[0.5]'}`}
              >
                  <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center mb-4 ${stamp.unlocked ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-zinc-300 dark:border-zinc-700 text-zinc-300 dark:text-zinc-700 border-dashed'}`}>
                     <span className="text-4xl">{stamp.unlocked ? stamp.icon : '🔒'}</span>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-1">{stamp.type}</div>
                  <h3 className="font-bold text-lg text-center text-slate-900 dark:text-white">{stamp.name}</h3>
                  <p className="text-sm text-slate-500 text-center flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {stamp.location}
                  </p>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedBadge(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* Header Header */}
              <div className="relative h-32 bg-gradient-to-br from-orange-400/20 to-blue-500/20 flex items-center justify-center">
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                </button>
                <div className="absolute -bottom-12 w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-5xl shadow-lg">
                  {selectedBadge.icon}
                </div>
              </div>

              {/* Content */}
              <div className="pt-16 pb-8 px-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedBadge.name}</h2>
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedBadge.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedBadge.visitedDate}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Actions Taken */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Activities Completed</h3>
                    <ul className="space-y-2">
                      {selectedBadge.activities?.map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-300">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Verification Proof */}
                  <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-4 border border-orange-100 dark:border-orange-500/20">
                    <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-2">Verification Proof</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300/80 leading-relaxed">
                      {selectedBadge.reason}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
