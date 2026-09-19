"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries, deleteItineraryFromFirestore } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';
import { DESTINATIONS } from '@/app/itinerary/data';
import { resolveImgSrc } from '@/lib/imageService';
import PlaceImage from '@/components/shared/PlaceImage';
import { Plane, LogIn, Trash2, AlertTriangle } from 'lucide-react';

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({
  open,
  title,
  onConfirm,
  onCancel,
  bulk,
}: {
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  bulk?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {bulk ? 'Delete All Trips?' : 'Delete This Trip?'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {bulk
                    ? 'All your saved itineraries will be permanently removed. This cannot be undone.'
                    : `"${title}" will be permanently deleted. This cannot be undone.`}
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
                >
                  {bulk ? 'Delete All' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SavedPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItineraryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    setDeletingId(id);
    await deleteItineraryFromFirestore(user.uid, id);
    setSavedItems(prev => prev.filter(i => i.id !== id));
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleClearAll = async () => {
    if (!user?.uid) return;
    for (const item of savedItems) {
      await deleteItineraryFromFirestore(user.uid, item.id);
    }
    setSavedItems([]);
    setConfirmClearAll(false);
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
            <button
              onClick={() => setConfirmClearAll(true)}
              className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
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

              const isDeleting = deletingId === saved.id;
              return (
                <motion.div key={saved.id} variants={itemAnim}
                  onClick={() => router.push(`/itinerary?load=${saved.id}`)}
                  className={`group cursor-pointer bg-card text-card-foreground rounded-3xl p-3 border border-border shadow-sm hover:shadow-xl transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
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
                    {/* Delete button — always visible on mobile, hover on desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ id: saved.id, title });
                      }}
                      title="Delete trip"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground shadow-sm z-10 border border-destructive/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Mobile clear all FAB */}
      {savedItems.length > 0 && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setConfirmClearAll(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-destructive text-destructive-foreground text-sm font-bold shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      )}

      {/* Confirm single delete */}
      <ConfirmDeleteModal
        open={!!confirmDelete}
        title={confirmDelete?.title}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Confirm clear all */}
      <ConfirmDeleteModal
        open={confirmClearAll}
        bulk
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
