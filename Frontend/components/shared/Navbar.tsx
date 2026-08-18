"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Globe, Heart, Menu, Search, User, X, LifeBuoy, LogOut, Info, ChevronDown, MapPin, Clock, Navigation, History, PlusCircle, Compass, Plane, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import { ALL_DESTINATIONS } from '@/components/features/explore/exploreData';

// Static page entries for search
const PAGE_ENTRIES = [
  { name: 'Plan a Trip', href: '/itinerary?new=true', icon: PlusCircle, desc: 'AI-powered itinerary generator' },
  { name: 'Explore Destinations', href: '/explore', icon: Compass, desc: 'Discover incredible India' },
  { name: 'Bookings', href: '/bookings', icon: Plane, desc: 'Flights, trains, cabs & hotels' },
  { name: 'Digital Passport', href: '/passport', icon: BookOpen, desc: 'Your travel stamps & leaderboard' },
  { name: 'Saved Trips', href: '/saved', icon: Heart, desc: 'Your saved itineraries' },
  { name: 'Travel Deals', href: '/deals', icon: Globe, desc: 'Compare prices across 500+ partners' },
  { name: 'About NaviiGo', href: '/about', icon: Info, desc: 'Our mission & team' },
  { name: 'Support', href: '/support', icon: LifeBuoy, desc: 'FAQs & help center' },
];

const ITINERARY_DROPDOWN = [
  { name: 'Create New', href: '/itinerary?new=true', icon: PlusCircle, desc: 'AI-powered trip planner', accent: 'text-emerald-500' },
  { name: 'Ongoing Trips', href: '/itinerary/ongoing', icon: Navigation, desc: 'Currently active journeys', accent: 'text-blue-500' },
  { name: 'Upcoming Trips', href: '/itinerary/upcoming', icon: Clock, desc: 'Planned future adventures', accent: 'text-purple-500' },
  { name: 'Trip History', href: '/itinerary/history', icon: History, desc: 'Past trips & memories', accent: 'text-amber-500' },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [itineraryDropdownOpen, setItineraryDropdownOpen] = useState(false);
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  // ── Search: filter destinations + pages by query ──
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { destinations: [], pages: [] };

    const destinations = ALL_DESTINATIONS.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.highlights.some(h => h.toLowerCase().includes(q))
    ).slice(0, 6);

    const pages = PAGE_ENTRIES.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
    ).slice(0, 4);

    return { destinations, pages };
  }, [searchQuery]);

  const totalResults = searchResults.destinations.length + searchResults.pages.length;

  // Reset selected index when query changes
  useEffect(() => { setSelectedIndex(-1); }, [searchQuery]);

  const navigateToResult = useCallback((index: number) => {
    const { destinations, pages } = searchResults;
    if (index < destinations.length) {
      router.push(`/explore/${encodeURIComponent(destinations[index].name)}`);
    } else {
      const pageIdx = index - destinations.length;
      if (pageIdx < pages.length) router.push(pages[pageIdx].href);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [searchResults, router]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setIsSearchOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, totalResults - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, -1)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        navigateToResult(selectedIndex);
      } else if (totalResults > 0) {
        navigateToResult(0);
      }
    }
  }, [selectedIndex, totalResults, navigateToResult]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const threshold = windowHeight * 0.7;
      setIsScrolled(scrollPosition > threshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    }, navRef);
    return () => ctx.revert();
  }, []);

  const toggleMenu = () => setIsOpen((v) => !v);
  const { user, signInWithGoogle, signOut } = useAuth();

  const handleDropdownEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setItineraryDropdownOpen(true);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setItineraryDropdownOpen(false), 200);
  };

  type NavIcon = (props: { className?: string }) => React.ReactNode;
  const navItems: Array<{ name: string; href: string; icon: NavIcon; hasDropdown?: boolean }> = [
    { name: 'Explore', href: '/explore', icon: Globe },
    { name: 'Passport', href: '/passport', icon: Heart },
    { name: 'Itinerary', href: '/itinerary', icon: Info, hasDropdown: true },
    { name: 'Bookings', href: '/bookings', icon: Globe },
    { name: 'Saved', href: '/saved', icon: Heart },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Support', href: '/support', icon: LifeBuoy },
  ];

  return (
    <>
      <motion.nav
        ref={navRef}
        data-lenis-prevent
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-black/5 dark:border-white/10 shadow-sm'
            : 'bg-slate-950/30 backdrop-blur-md border-b border-white/5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.div className="flex items-center space-x-2 group" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image src="/content.png" alt="NaviiGo Logo" fill sizes="40px" className="object-cover" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">NaviiGo</span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 justify-center flex-1 mx-4">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={item.hasDropdown ? handleDropdownEnter : undefined}
                  onMouseLeave={item.hasDropdown ? handleDropdownLeave : undefined}
                >
                  <motion.div
                    className="flex items-center px-2.5 py-1.5 rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 transition-all relative group dark:text-slate-300 dark:hover:text-secondary dark:hover:bg-white/5"
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <Link href={item.href} className="flex items-center gap-1.5 text-[13px]">
                      <item.icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                      <span className="font-semibold tracking-wide">{item.name}</span>
                      {item.hasDropdown && <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${itineraryDropdownOpen ? 'rotate-180' : ''}`} />}
                    </Link>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>

                  {/* Itinerary Dropdown */}
                  {item.hasDropdown && (
                    <AnimatePresence>
                      {itineraryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-black/5 dark:border-white/10 overflow-hidden z-50"
                        >
                          <div className="p-2">
                            {ITINERARY_DROPDOWN.map((sub) => (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                onClick={() => setItineraryDropdownOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group/item"
                              >
                                <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center ${sub.accent} group-hover/item:scale-110 transition-transform`}>
                                  <sub.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{sub.name}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub.desc}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">✨ AI-Powered Itinerary Management</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <motion.button
                onClick={() => { setIsSearchOpen(true); setSearchQuery(''); setSelectedIndex(-1); }}
                className="p-2 rounded-full hover:bg-black/5 text-slate-700 transition-colors dark:text-slate-200 dark:hover:bg-white/10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open search"
                aria-haspopup="dialog"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* <ThemeToggle /> */}

              {user ? (
                <div className="flex items-center gap-3 pl-2">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none mb-0.5">{user.displayName?.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide">MEMBER</span>
                  </div>
                  {user.photoURL ? (
                    <motion.div whileHover={{ scale: 1.05 }} className="relative">
                      <Image src={user.photoURL!} alt="User" width={36} height={36} className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    </motion.div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <motion.button
                    onClick={() => signOut()}
                    className="p-2 ml-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#0066cc] text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 transition-all font-medium"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Sign In</span>
                </motion.button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-black/5 text-slate-700 dark:text-slate-200 dark:hover:bg-white/10 relative z-[60]"
              whileTap={{ scale: 0.9 }}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay — only rendered client-side to avoid hydration mismatch */}
      {mounted && (
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
          className="absolute right-0 top-0 bottom-0 bg-white/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:bg-slate-950/95 dark:ring-white/10 overflow-y-auto"
        >
          <div className="p-6 pt-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <Image src="/content.png" alt="NaviiGo" fill sizes="36px" className="object-cover" />
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">NaviiGo</span>
              </div>
              <motion.button onClick={toggleMenu} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" whileTap={{ scale: 0.9 }}>
                <X className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </motion.button>
            </div>

            <div className="space-y-2">
              {navItems.map((item, index) => (
                <div key={item.name}>
                  <motion.div
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 text-slate-800 hover:text-primary transition-colors dark:text-slate-200 dark:hover:text-secondary"
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
                      <button onClick={() => setMobileItineraryOpen(v => !v)} className="p-1">
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
                              <Link key={sub.name} href={sub.href} onClick={toggleMenu} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-secondary transition-colors">
                                <sub.icon className={`w-4 h-4 ${sub.accent}`} />
                                <div>
                                  <div className="text-sm font-medium">{sub.name}</div>
                                  <div className="text-[10px] text-slate-400">{sub.desc}</div>
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

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Theme</div>
              {/* <ThemeToggle /> */}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-slate-800" suppressHydrationWarning>
              {user ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    {user.photoURL ? (
                      <Image src={user.photoURL!} alt="User" width={40} height={40} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight truncate" title={user.displayName || 'Traveler'}>{user.displayName || 'Traveler'}</span>
                      <span className="text-[10px] text-slate-500 font-medium tracking-wide">MEMBER</span>
                    </div>
                  </div>
                  <motion.button onClick={() => { toggleMenu(); signOut(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </motion.button>
                </div>
              ) : (
                <>
                  <motion.button onClick={() => { toggleMenu(); signInWithGoogle(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-shadow" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <User className="w-4 h-4" />
                    <span className="font-medium">Sign In</span>
                  </motion.button>
                  <motion.button onClick={() => { toggleMenu(); signInWithGoogle(); }} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 border-black/10 text-slate-800 hover:border-primary hover:text-primary transition-colors dark:border-white/15 dark:text-slate-200 dark:hover:border-secondary dark:hover:text-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <span className="font-medium">Create Account</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-24 px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search NaviiGo"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search destinations, pages..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                  role="combobox"
                  aria-expanded={totalResults > 0}
                  aria-controls="search-results"
                  aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors" aria-label="Clear search">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsSearchOpen(false)} className="ml-2 px-3 py-1 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">Esc</button>
              </div>

              {/* Search Results */}
              <div id="search-results" className="max-h-[60vh] overflow-y-auto" role="listbox">
                {searchQuery.trim() && totalResults > 0 ? (
                  <div className="py-2">
                    {/* Destination Results */}
                    {searchResults.destinations.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destinations</h3>
                      </div>
                    )}
                    {searchResults.destinations.map((dest, i) => (
                      <button
                        key={dest.id}
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={selectedIndex === i}
                        onClick={() => navigateToResult(i)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          selectedIndex === i
                            ? 'bg-blue-50 dark:bg-blue-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{dest.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{dest.state} · {dest.category} · {dest.tagline}</div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">{dest.rating}★</span>
                      </button>
                    ))}

                    {/* Page Results */}
                    {searchResults.pages.length > 0 && (
                      <div className="px-4 pt-4 pb-1">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pages</h3>
                      </div>
                    )}
                    {searchResults.pages.map((page, i) => {
                      const idx = searchResults.destinations.length + i;
                      return (
                        <button
                          key={page.href}
                          id={`search-result-${idx}`}
                          role="option"
                          aria-selected={selectedIndex === idx}
                          onClick={() => navigateToResult(idx)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            selectedIndex === idx
                              ? 'bg-blue-50 dark:bg-blue-500/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <page.icon className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{page.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{page.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.trim() && totalResults === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="text-3xl mb-3">🔍</div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No results for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try searching for a city, state, or category</p>
                  </div>
                ) : (
                  /* Quick Jump (shown when no query) */
                  <div className="px-4 py-5 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quick Jump</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Goa', href: '/explore/Goa' },
                        { label: 'Manali', href: '/explore/Manali' },
                        { label: 'Varanasi', href: '/explore/Varanasi' },
                        { label: 'Kerala', href: '/explore/Kerala Backwaters' },
                        { label: 'Ladakh', href: '/explore/Ladakh' },
                        { label: 'Jaipur', href: '/explore/Jaipur' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => { router.push(item.href); setIsSearchOpen(false); }}
                          className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-black/5 dark:ring-white/5 hover:ring-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500"><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">↑↓</kbd> navigate &nbsp; <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">↵</kbd> select &nbsp; <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">esc</kbd> close</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
