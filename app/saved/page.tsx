"use client";

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries, deleteItineraryFromFirestore } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';
import { DESTINATIONS } from '@/app/itinerary/data';
import { Plane, LogIn } from 'lucide-react';

export default function SavedPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItineraryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    getUserItineraries(user.uid)
      .then((items) => {
        setSavedItems(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user?.uid) return;
    await deleteItineraryFromFirestore(user.uid, id);
    setSavedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = async () => {
    if (!user?.uid) return;
    for (const item of savedItems) {
      await deleteItineraryFromFirestore(user.uid, item.id);
    }
    setSavedItems([]);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-32 px-6 md:px-12 pb-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 border-b border-zinc-200 dark:border-white/5 pb-8 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white">Your <span className="italic font-serif text-emerald-500">Saved</span> Trips.</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg">Pick up right where you left off.</p>
          </div>
          {savedItems.length > 0 && (
            <button onClick={handleClearAll} className="hidden md:block text-sm font-medium uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">Clear All</button>
          )}
        </motion.div>

        {/* Not logged in */}
        {!user && (
          <div className="text-center py-20">
            <LogIn className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Sign in to see your saved trips</h3>
            <p className="text-zinc-500 mb-6">Your itineraries are saved to the cloud and sync across devices.</p>
            <button onClick={signInWithGoogle} className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-500 transition-colors">Sign In with Google</button>
          </div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {user && !loading && savedItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">No saved trips yet</h3>
            <p className="text-zinc-500 mb-6">Start planning your next adventure to save it here.</p>
            <button onClick={() => router.push('/itinerary')} className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-500 transition-colors">Start Planning</button>
          </div>
        )}

        {/* Trip cards */}
        {user && !loading && savedItems.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedItems.map((saved) => {
              const destInfo = DESTINATIONS.find(d => d.id === saved.destId);
              const imgUrl = destInfo ? `https://images.unsplash.com/photo-${destInfo.img}?auto=format&fit=crop&w=800&q=80` : '';
              const form = saved.form as any;
              const title = saved.destName;
              let dates = `${form.days} Days`;
              if (form.startDate && form.endDate) {
                try {
                  dates = `${new Date(form.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(form.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                } catch (e) { }
              }
              const typeLabel = form.purpose ? (form.purpose.charAt(0).toUpperCase() + form.purpose.slice(1)) : 'Trip';

              return (
                <motion.div key={saved.id} variants={itemAnim}
                  onClick={() => router.push(`/itinerary?load=${saved.id}`)}
                  className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-3xl p-3 border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                    {imgUrl ? (
                      <img src={imgUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Plane className="w-12 h-12 text-white/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 shadow-sm">
                      {typeLabel}
                    </div>
                    <button onClick={(e) => handleDelete(e, saved.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm z-10">✕</button>
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="text-xl font-bold mb-1 text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-zinc-500 font-medium text-sm">{dates}</p>
                      {form.budget && <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">₹{Number(form.budget).toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div variants={itemAnim} onClick={() => router.push('/itinerary')} className="h-full min-h-[280px] rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer group">
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">➕</span>
              <span className="font-bold">Plan New Trip</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
