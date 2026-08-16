'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, Utensils, Gem, ChevronRight, Compass, Heart, ArrowRight, Loader2, Users, Calendar, Flame, X, Globe, Sparkles, Sun, Waves, Mountain, Footprints } from 'lucide-react';
import {
  ALL_DESTINATIONS, HIDDEN_GEMS, CUISINES, TRENDING, SEASONAL,
  CATEGORIES, BENTO_DEST, type Destination,
} from '@/components/features/explore/exploreData';
import { startCityView, trackCategoryClick } from '@/lib/browsingSignals';
import { useAuth } from '@/lib/AuthContext';
import { toggleBucketListItem, getUserBucketList } from '@/lib/firestore';
import ExploreHero from '@/components/features/explore/ExploreHero';
import BentoGrid from '@/components/features/explore/BentoGrid';
import CuisineSection from '@/components/features/explore/CuisineSection';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'All': <Globe className="w-3.5 h-3.5" />,
  'Heritage': <Sparkles className="w-3.5 h-3.5" />,
  'Nature': <Sun className="w-3.5 h-3.5" />,
  'Beach': <Waves className="w-3.5 h-3.5" />,
  'Mountain': <Mountain className="w-3.5 h-3.5" />,
  'Adventure': <Footprints className="w-3.5 h-3.5" />,
  'Spiritual': <Compass className="w-3.5 h-3.5" />,
};

function ExplorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCount, setShowCount] = useState(12);
  const [visibleSections, setVisibleSections] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liked, setLiked] = useState<Set<number | string>>(new Set());
  const [expandedGem, setExpandedGem] = useState<string | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const [selectedCuisine, setSelectedCuisine] = useState(0);
  const loadRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const TOTAL_SECTIONS = 6;

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    if (!loadRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && visibleSections < TOTAL_SECTIONS) {
        setLoadingMore(true);
        setTimeout(() => { setVisibleSections(p => Math.min(p + 1, TOTAL_SECTIONS)); setLoadingMore(false); }, 600);
      }
    }, { threshold: 0.1 });
    obs.observe(loadRef.current);
    return () => obs.disconnect();
  }, [visibleSections]);

  useEffect(() => {
    if (user?.uid) {
      getUserBucketList(user.uid).then(list => {
        setLiked(new Set(list.map(item => item.id)));
      });
    } else {
      setLiked(new Set());
    }
  }, [user?.uid]);

  const filtered = useMemo(() => {
    return ALL_DESTINATIONS.filter(d => {
      const q = searchQuery.toLowerCase();
      const ms = !searchQuery || d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q);
      const mc = activeCategory === 'All' || d.category === activeCategory;
      return ms && mc;
    });
  }, [searchQuery, activeCategory]);

  const toggleLike = useCallback(async (d: any) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    const id = d.id ?? d.name; // Use ID or name
    setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    try {
      await toggleBucketListItem(user.uid, { id: String(id), name: d.name, type: 'destination', image: d.image, location: d.state });
    } catch (e) {
      console.error(e);
    }
  }, [user, signInWithGoogle]);

  const go = (name: string) => { startCityView(name); router.push(`/explore/${encodeURIComponent(name)}`); };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden w-full max-w-[100vw]">

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} className="relative h-[60vh] sm:h-[75vh] md:h-[85vh] min-h-[480px] sm:min-h-[560px] md:min-h-[620px] flex items-center justify-center overflow-hidden pt-20 sm:pt-28">
        {/* Parallax background */}
        <motion.div style={{ scale: heroScale, y: heroY }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/destinations/agra.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f5f7] dark:from-black via-transparent to-black/30" />
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-[5.5rem] font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            Every corner of India.
            <span className="block text-white/70 italic font-serif mt-1 sm:mt-2">Told differently.</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto mb-8 sm:mb-12 font-medium leading-relaxed px-4 whitespace-normal break-words w-full">
            Discover curated stays, hidden beaches, and ancient paths curated for the modern traveler.
          </p>

          {/* Search */}
          <div className="max-w-3xl mx-auto w-full px-1">
            <div className="relative group">
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 hover:bg-white/15 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-2xl overflow-visible">
                <Search className="relative z-10 ml-3 sm:ml-6 w-5 h-5 text-white/50 shrink-0" />
                <input type="text" placeholder="Search destinations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="relative z-10 flex-1 min-w-0 bg-transparent border-none outline-none px-3 sm:px-5 py-4 sm:py-5 text-white placeholder:text-white/40 text-sm sm:text-base font-medium" />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="relative z-10 mr-3 sm:mr-5 text-white/50 hover:text-white text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 shrink-0"><X className="w-3.5 h-3.5" /> Clear</button>
                ) : (
                  <button className="relative z-10 mr-3 sm:mr-5 bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0">
                    Search
                  </button>
                )}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => { setActiveCategory(c); trackCategoryClick(c); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap shrink-0 ${activeCategory === c
                    ? 'bg-white text-black'
                    : 'bg-transparent text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                    }`}>
                  {CATEGORY_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════ BENTO DESTINATIONS ══════════════ */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1 sm:mb-2">Destinations</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 mb-6 sm:mb-8">{filtered.length} places to discover</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-[200px] sm:auto-rows-[220px] md:auto-rows-[200px] gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.slice(0, showCount).map((d, i) => {
              const bentoClass = BENTO_DEST[i % BENTO_DEST.length] || '';
              const isLarge = bentoClass.includes('col-span-2') && bentoClass.includes('row-span-2');
              const isTall = !isLarge && bentoClass.includes('row-span-2');
              return (
                <Link key={d.id} href={`/explore/${encodeURIComponent(d.name)}`} onClick={() => startCityView(d.name)} className={`block ${bentoClass}`}>
                <motion.div layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.35, ease: 'easeOut' }}
                  className={`group relative h-full w-full rounded-xl overflow-hidden cursor-pointer bg-black shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-lg transition-shadow duration-300`}
                >
                  <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.image})` }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

                  {/* Like btn */}
                  <button onClick={e => { e.stopPropagation(); toggleLike(d); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center z-10 transition-colors">
                    <Heart className={`w-4 h-4 transition-all ${liked.has(d.id) || liked.has(String(d.id)) ? 'fill-rose-500 text-rose-500' : 'text-white/90'}`} />
                  </button>

                  {/* Category badge - top left */}
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide z-10">{d.category}</div>

                  {/* Content overlay - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-white/90">{d.rating}</span>
                      <span className="text-xs text-white/50 font-normal ml-1 border-l border-white/20 pl-1">Popular</span>
                    </div>
                    <h3 className={`font-bold text-white mb-0.5 tracking-tight leading-tight ${isLarge ? 'text-xl sm:text-3xl lg:text-4xl' : isTall ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl md:text-lg'}`}>{d.name}</h3>
                    <p className={`text-white/70 font-medium truncate ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'}`}>{d.state}</p>

                    {/* Details row - always visible on mobile, conditional on desktop */}
                    <div className={`flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/10 ${!isLarge && !isTall ? 'md:hidden' : ''}`}>
                      <span className="text-xs text-white/80 font-medium">{d.bestTime}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/80 font-medium">{d.duration}</span>
                      <div className="ml-auto text-xs font-bold text-white">{d.budget}</div>
                    </div>
                  </div>
                </motion.div>
                </Link>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Load More button */}
        {showCount < filtered.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowCount(prev => Math.min(prev + 12, filtered.length))}
              className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              Load More ({filtered.length - showCount} remaining)
              <ChevronRight className="w-4 h-4 rotate-90 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium mb-3">No results for &ldquo;{searchQuery}&rdquo;</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors">Reset</button>
          </div>
        )}
      </section>

      {/* ══════════════ HIDDEN GEMS — Editorial Expandable Cards ══════════════ */}
      {visibleSections >= 2 && (
        <section className="relative py-12 sm:py-20 bg-white dark:bg-[#0a0a0a] border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 relative">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-3">
                  <Gem className="w-4 h-4" /> Off the beaten path
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Hidden Gems</h2>
                <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg font-medium">Places most travelers never find — curated for the curious soul.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HIDDEN_GEMS.map((gem, i) => {
                const isExpanded = expandedGem === gem.name;
                return (
                  <motion.div key={gem.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                    onClick={() => setExpandedGem(isExpanded ? null : gem.name)}
                    className="group cursor-pointer">
                    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="relative h-48 overflow-hidden">
                        <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${gem.image})` }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className="bg-white/90 text-zinc-900 text-[10px] px-2.5 py-1 rounded-sm font-bold shadow-sm">{gem.crowdLevel} crowd</span>
                          <button onClick={e => { e.stopPropagation(); toggleLike({ id: gem.name, name: gem.name, state: gem.state, image: gem.image }); }}
                            className="w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center z-10 transition-colors">
                            <Heart className={`w-3.5 h-3.5 transition-all ${liked.has(gem.name) ? 'fill-rose-500 text-rose-500' : 'text-white/90'}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white tracking-tight">{gem.name}</h3>
                          <span className="text-xs font-medium text-white/80">{gem.state} · Best: {gem.bestSeason}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{gem.desc}</p>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-zinc-500">Difficulty</span>
                                  <span className="font-semibold text-zinc-900 dark:text-white">{gem.difficulty}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); go(gem.name); }}
                                  className="w-full bg-amber-500 hover:bg-amber-400 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                  <Compass className="w-4 h-4" /> Plan This Adventure
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Click to {isExpanded ? 'collapse' : 'explore'}</span>
                          <ChevronRight className={`w-4 h-4 text-amber-500 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ CUISINES — Interactive Tabbed Showcase ══════════════ */}
      {visibleSections >= 3 && (
        <section className="py-12 sm:py-20 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-3">
                  <Utensils className="w-4 h-4" /> A culinary journey
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Cuisines of India</h2>
                <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Every region. Every flavor. One incredible subcontinent.</p>
              </div>
            </div>

            {/* Tab buttons */}
            <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              {CUISINES.map((c, i) => (
                <button key={c.region} onClick={() => setSelectedCuisine(i)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border whitespace-nowrap shrink-0 ${selectedCuisine === i
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-sm'
                    : 'bg-white dark:bg-[#111] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}>
                  {c.region}
                </button>
              ))}
            </div>

            {/* Active cuisine detail */}
            <AnimatePresence mode="wait">
              <motion.div key={selectedCuisine} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="flex flex-col lg:flex-row bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                {/* Image side */}
                <div className="relative lg:w-1/2 h-72 lg:h-auto min-h-[300px] overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${CUISINES[selectedCuisine].image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl bg-white/20 backdrop-blur-md p-2 rounded-lg">{CUISINES[selectedCuisine].icon}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{CUISINES[selectedCuisine].region}</h3>
                    <p className="text-sm font-medium text-white/80 mt-1">{CUISINES[selectedCuisine].states}</p>
                  </div>
                </div>
                {/* Dishes */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-5">Signature Dishes</h4>
                  <div className="space-y-4">
                    {CUISINES[selectedCuisine].dishes.map((dish, di) => (
                      <div key={dish.name} className="flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white text-sm font-bold shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-700">
                          {di + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h5 className="font-bold text-zinc-900 dark:text-white text-base">{dish.name}</h5>
                            {'city' in dish && (dish as any).city && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">{(dish as any).city}</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{dish.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => go(CUISINES[selectedCuisine].region + ' Food Trail')}
                    className="mt-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 px-6 rounded-xl font-bold text-sm hover:opacity-90 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm w-full md:w-auto">
                    <Utensils className="w-4 h-4" /> Explore {CUISINES[selectedCuisine].region} Menus
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ══════════════ TRENDING — Portrait Cards ══════════════ */}
      {visibleSections >= 4 && (
        <section className="py-10 sm:py-16 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-3">
                  <Flame className="w-4 h-4" /> Hot right now
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Trending Destinations</h2>
              </div>
              <Link href="/itinerary?new=true" className="hidden md:flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {TRENDING.map((t, i) => (
                <div key={t.name}
                  onClick={() => go(t.name)}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:shadow-md transition-shadow duration-300">
                  <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.image})` }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.8 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-1.5 text-zinc-200 text-[10px] font-bold mb-2">
                      <span className="uppercase tracking-wider">{t.travelers}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{t.name}</h3>
                    <p className="text-xs text-white/80 font-medium">{t.state} · {t.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ SEASONAL — Editorial Horizontal Cards ══════════════ */}
      {visibleSections >= 5 && (
        <section className="py-16 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="mb-10">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-3">
                <Calendar className="w-4 h-4" /> Time-limited
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Seasonal Picks</h2>
              <p className="text-base font-medium text-zinc-500 dark:text-zinc-400 mt-2">Once-a-year experiences you don&apos;t want to miss.</p>
            </div>

            <div className="space-y-4">
              {SEASONAL.map((s, i) => (
                <div key={s.name}
                  onClick={() => go(s.name)}
                  className="group flex flex-col md:flex-row rounded-xl overflow-hidden bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">
                  <div className="relative md:w-1/3 h-56 md:h-auto min-h-[200px] overflow-hidden">
                    <motion.div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${s.image})` }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.8 }} />
                    <div className="absolute top-4 left-4 bg-white/90 text-zinc-900 text-[10px] px-3 py-1 rounded-sm font-bold shadow-sm">{s.season}</div>
                  </div>
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">{s.name}</h3>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{s.note}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      <Users className="w-3.5 h-3.5" /> Best for: {s.bestFor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Infinite scroll trigger ── */}
      {visibleSections < TOTAL_SECTIONS && (
        <div ref={loadRef} className="flex items-center justify-center py-10">
          {loadingMore ? (
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading more...
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
              <ChevronRight className="w-3 h-3 text-zinc-400 rotate-90" />
            </div>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      {visibleSections >= TOTAL_SECTIONS && (
        <section className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-12 sm:py-20">
          <div className="bg-zinc-900 dark:bg-white rounded-2xl p-6 sm:p-10 md:p-14 text-center shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-black mb-3 tracking-tight">Ready to book?</h2>
            <p className="text-zinc-400 dark:text-zinc-500 mb-8 text-base font-medium">Use our planning tools to craft the perfect itinerary.</p>
            <Link href="/itinerary?new=true" className="inline-flex items-center gap-2 bg-white dark:bg-black text-black dark:text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:scale-[1.02] transition-transform">
              Start Planning
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
