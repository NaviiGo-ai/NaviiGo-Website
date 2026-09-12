'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Heart, Info, Plane, LifeBuoy, User, X, Menu, ChevronDown, Compass, Navigation, Clock, History, BookOpen, Bookmark, LogOut, PlusCircle, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
const ITINERARY_DROPDOWN = [
  { name: 'Create New', href: '/itinerary?new=true', icon: PlusCircle, desc: 'AI-powered trip planner', accent: 'text-jungle-green-500' },
  { name: 'Ongoing Trips', href: '/itinerary/ongoing', icon: Navigation, desc: 'Currently active journeys', accent: 'text-deep-sea-500' },
  { name: 'Upcoming Trips', href: '/itinerary/upcoming', icon: Clock, desc: 'Planned future adventures', accent: 'text-indigo-500' },
  { name: 'Trip History', href: '/itinerary/history', icon: History, desc: 'Past trips & memories', accent: 'text-saffron-500' },
];

export default function MobileNav({ isOpen, toggleMenu }: { isOpen: boolean; toggleMenu: () => void }) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);

  return (
    <motion.div
      suppressHydrationWarning
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20, pointerEvents: isOpen ? 'auto' as const : 'none' as const }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 md:hidden"
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleMenu} />
      <motion.div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ width: '100%' }}
        className="absolute right-0 top-0 bottom-0 bg-white/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:bg-muted-950/95 dark:ring-white/10 overflow-y-auto"
      >
        <div className="p-6 pt-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-indigo" aria-hidden="true">
                <Compass className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-foreground text-lg tracking-tight font-serif">NaviiGo</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <motion.button onClick={toggleMenu} className="p-2 rounded-lg hover:bg-saffron/20 text-saffron" whileTap={{ scale: 0.9 }}>
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Explore', href: '/explore', icon: Globe },
              { name: 'Passport', href: '/passport', icon: Heart },
              { name: 'Itinerary', href: '/itinerary', icon: Info, hasDropdown: true },
              { name: 'Bookings', href: '/bookings', icon: Plane },
              { name: 'Saved', href: '/saved', icon: Heart },
              { name: 'About', href: '/about', icon: Info },
              { name: 'Support', href: '/support', icon: LifeBuoy },
            ].map((item, index) => (
              <div key={item.name}>
                <motion.div
                  className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-saffron/10 hover:to-indigo/10 text-muted-800 hover:text-saffron transition-colors dark:text-muted-200 dark:hover:text-indigo"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="flex flex-1 items-center space-x-3"
                    onClick={item.hasDropdown ? (e) => { e.preventDefault(); setMobileItineraryOpen(v => !v); } : toggleMenu}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                  {item.hasDropdown && (
                    <button onClick={() => setMobileItineraryOpen(v => !v)} className="p-1" aria-label={mobileItineraryOpen ? 'Collapse Itinerary menu' : 'Expand Itinerary menu'} aria-expanded={mobileItineraryOpen}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileItineraryOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </motion.div>
                {item.hasDropdown && (
                  <AnimatePresence>
                    {mobileItineraryOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="pl-8 pr-2 py-1 space-y-1">
                          {ITINERARY_DROPDOWN.map((sub) => (
                            <Link key={sub.name} href={sub.href} onClick={toggleMenu} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-600 dark:text-muted-400 hover:bg-muted-100 dark:hover:bg-white/5 hover:text-saffron dark:hover:text-indigo transition-colors">
                              <sub.icon className={`w-4 h-4 ${sub.accent}`} />
                              <div>
                                <div className="text-sm font-medium">{sub.name}</div>
                                <div className="text-[10px] text-muted-400">{sub.desc}</div>
                              </div>
                              </Link>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-2.5 px-1 border-t border-border/60">
            <span className="text-sm font-extrabold text-saffron">Color Theme</span>
            <ThemeToggle />
          </div>

          <div className="space-y-3 pt-6 border-t border-muted-200 dark:border-muted-800" suppressHydrationWarning>
            {user ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3 px-2">
                  {user.photoURL ? (
                    <Image src={user.photoURL!} alt="User" width={40} height={40} className="w-10 h-10 rounded-full border-2 border-white dark:border-muted-800 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted-200 dark:bg-muted-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-500 dark:text-muted-400" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-muted-800 dark:text-muted-200 leading-tight truncate" title={user.displayName || 'Traveler'}>{user.displayName || 'Traveler'}</span>
                    <span className="text-[10px] text-muted-500 font-medium tracking-wide">MEMBER</span>
                  </div>
                </div>
                <motion.button onClick={() => { toggleMenu(); signOut(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-[var(--color-temple-red)] text-[var(--color-temple-red)] hover:bg-[var(--color-temple-red)/10] transition-colors dark:border-[var(--color-temple-red)/50] dark:text-[var(--color-temple-red)/80] dark:hover:bg-[var(--color-temple-red)/20]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </div>
            ) : (
              <>
                <motion.button onClick={() => { toggleMenu(); signInWithGoogle(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-saffron to-indigo text-warm-ivory hover:shadow-lg transition-shadow" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <User className="w-4 h-4" />
                  <span className="font-medium">Sign In</span>
                </motion.button>
                <motion.button onClick={() => { toggleMenu(); signInWithGoogle(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 border-saffron/20 text-saffron hover:border-saffron hover:text-warm-ivory transition-colors dark:border-white/15 dark:text-muted-200 dark:hover:border-indigo dark:hover:text-indigo" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <span className="font-medium">Create Account</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}