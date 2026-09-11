"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries, deleteItineraryFromFirestore } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';
import { DESTINATIONS } from '@/app/itinerary/data';
import { resolveImgSrc } from '@/lib/imageService';
import PlaceImage from '@/components/shared/PlaceImage';
import { Plane, LogIn } from 'lucide-react';

export default function SavedPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItineraryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-32 px-4 sm:px-6 md:px-12 pb-24 font-sans">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 border-b border-border pb-8 flex justify-between items-end"
        >
          <div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground font-serif">Your <span className="italic text-primary">Saved</span> Trips.</h1>
            <p className="text-muted-foreground mt-4 text-lg">Pick up right where you left off.</p>
          </div>
          {savedItems.length > 0 && (
            <button onClick={handleClearAll} className="hidden md:block text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors">Clear All</button>
          )}
        </motion.div>

        {/* Not logged in */}
        {!user && (
          <div className="text-center py-20">
            <LogIn className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Sign in to see your saved trips</h3>
            <p className="text-muted-foreground mb-6">Your itineraries are saved to the cloud and sync across devices.</p>
            <button onClick={signInWithGoogle} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">Sign In with Google</button>
          </div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {user && !loading && savedItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-bold text-foreground mb-2">No saved trips yet</h3>
            <p className="text-muted-foreground mb-6">Start planning your next adventure to save it here.</p>
            <button onClick={() => router.push('/itinerary')} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">Start Planning</button>
          </div>
        )}

        {/* Trip cards */}
        {user && !loading && savedItems.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedItems.map((saved) => {
              const destInfo = DESTINATIONS.find(d => d.id === saved.destId);
              const imgUrl = destInfo ? resolveImgSrc(destInfo.img, 800) : '';
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
                  className="group cursor-pointer bg-card text-card-foreground rounded-3xl p-3 border border-border shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-4 border border-border">
                    <PlaceImage
                      name={saved.destName}
                      fallbackUrl={imgUrl}
                      asBackground
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                      width={800}
                    />
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground border border-border shadow-xs">
                      {typeLabel}
                    </div>
                    <button onClick={(e) => handleDelete(e, saved.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-destructive-foreground shadow-xs z-10">✕</button>
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="text-xl font-bold mb-1 text-card-foreground group-hover:text-primary transition-colors font-serif">{title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-muted-foreground font-medium text-sm">{dates}</p>
                      {form.budget && <p className="text-primary font-bold text-sm">₹{Number(form.budget).toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.div variants={itemAnim} onClick={() => router.push('/itinerary')} className="h-full min-h-[280px] rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group">
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">➕</span>
              <span className="font-bold">Plan New Trip</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
