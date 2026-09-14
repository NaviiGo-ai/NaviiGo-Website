'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gem, ChevronRight, Compass, Heart, ArrowRight, Loader2, Users, Calendar, Flame } from 'lucide-react';
import {
  ALL_DESTINATIONS, HIDDEN_GEMS, CUISINES, TRENDING, SEASONAL,
  CATEGORIES,
} from '@/components/features/explore/exploreData';
import { startCityView, trackCategoryClick } from '@/lib/browsingSignals';
import { useAuth } from '@/lib/AuthContext';
import { toggleBucketListItem, getUserBucketList } from '@/lib/firestore';
import ExploreHero from '@/components/features/explore/ExploreHero';
import AtlasGrid from '@/components/features/explore/AtlasGrid';
import CuisineSection from '@/components/features/explore/CuisineSection';
import PlaceImage from '@/components/shared/PlaceImage';

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
  const TOTAL_SECTIONS = 6;

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

  const [prevUserUid, setPrevUserUid] = useState(user?.uid);
  if (user?.uid !== prevUserUid) {
    setPrevUserUid(user?.uid);
    if (!user?.uid) {
      setLiked(new Set());
    }
  }

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getUserBucketList(user.uid).then(list => {
      if (active) {
        setLiked(new Set(list.map(item => item.id)));
      }
    });
    return () => { active = false; };
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_DESTINATIONS.length };
    for (const d of ALL_DESTINATIONS) {
      counts[d.category] = (counts[d.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-text overflow-x-hidden w-full max-w-[100vw] font-sans">
      {/* ══════════════ 01 / DIGITAL TRAVEL ATLAS HERO ══════════════ */}
      <ExploreHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={(c) => { setActiveCategory(c); trackCategoryClick(c); }}
        categoryCounts={categoryCounts}
      />

      {/* ══════════════ ATLAS DESTINATIONS (ASYMMETRIC FLOW) ══════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-12 sm:py-16">
        <AtlasGrid
          destinations={filtered.slice(0, showCount)}
          total={filtered.length}
          liked={liked}
          onToggleLike={toggleLike}
          onSelect={startCityView}
          onLoadMore={() => setShowCount(prev => Math.min(prev + 12, filtered.length))}
          searchQuery={searchQuery}
          onReset={() => { setSearchQuery(''); setActiveCategory('All'); }}
        />
      </section>

      {/* ══════════════ HIDDEN GEMS — Editorial Expandable Cards ══════════════ */}
      {visibleSections >= 2 && (
        <section className="relative py-12 sm:py-20 bg-paper-light border-t border-naviigo-brown/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 relative">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-naviigo-orange font-mono text-xs font-semibold tracking-widest uppercase mb-3">
                  <Gem className="w-3.5 h-3.5" /> Off the beaten path
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-naviigo-brown tracking-tight uppercase">Hidden Gems</h2>
                <p className="text-base text-naviigo-text/70 mt-2 max-w-lg font-light">Places most travelers never find — curated for the quiet explorer.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HIDDEN_GEMS.map((gem, i) => {
                const isExpanded = expandedGem === gem.name;
                return (
                  <motion.div key={gem.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                    onClick={() => setExpandedGem(isExpanded ? null : gem.name)}
                    className="group cursor-pointer">
                    <div className="relative rounded-2xl overflow-hidden bg-paper-warm border border-naviigo-brown/10 shadow-sm hover:shadow-md hover:border-naviigo-orange/40 transition-all duration-300">
                      <div className="relative h-48 overflow-hidden">
                        <PlaceImage
                          name={gem.name}
                          city={gem.state}
                          fallbackUrl={gem.image}
                          asBackground
                          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className="bg-white/90 text-naviigo-brown text-[10px] px-2.5 py-1 rounded font-mono font-bold shadow-sm">{gem.crowdLevel} crowd</span>
                          <button onClick={e => { e.stopPropagation(); toggleLike({ id: gem.name, name: gem.name, state: gem.state, image: gem.image }); }}
                            className="w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center z-10 transition-colors">
                            <Heart className={`w-3.5 h-3.5 transition-all ${liked.has(gem.name) ? 'fill-naviigo-orange text-naviigo-orange' : 'text-white/90'}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">{gem.name}</h3>
                          <span className="text-xs font-mono text-white/80">{gem.state} · Best: {gem.bestSeason}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-naviigo-text/75 font-light leading-relaxed">{gem.desc}</p>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t border-naviigo-brown/10 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-naviigo-text/60 font-mono text-xs">Difficulty</span>
                                  <span className="font-semibold text-naviigo-brown">{gem.difficulty}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); go(gem.name); }}
                                  className="w-full bg-naviigo-orange hover:bg-naviigo-orange/90 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                  <Compass className="w-4 h-4" /> Plan This Adventure
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-naviigo-text/50 font-mono uppercase tracking-wider">Click to {isExpanded ? 'collapse' : 'explore'}</span>
                          <ChevronRight className={`w-4 h-4 text-naviigo-orange transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
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
        <section className="py-12 sm:py-20 border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <CuisineSection
              cuisines={CUISINES}
              selectedIndex={selectedCuisine}
              onSelect={setSelectedCuisine}
              onExplore={(region) => go(region + ' Food Trail')}
            />
          </div>
        </section>
      )}

      {/* ══════════════ TRENDING — Portrait Cards ══════════════ */}
      {visibleSections >= 4 && (
        <section className="py-10 sm:py-16 bg-paper-light border-t border-naviigo-brown/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-naviigo-orange font-mono text-xs font-semibold tracking-widest uppercase mb-3">
                  <Flame className="w-3.5 h-3.5" /> High Interest Routes
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-naviigo-brown tracking-tight uppercase">Trending Horizons</h2>
              </div>
              <Link href="/itinerary?new=true" className="hidden md:flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-naviigo-orange hover:text-naviigo-brown transition-colors">Curate Route <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {TRENDING.map((t) => (
                <div key={t.name}
                  onClick={() => go(t.name)}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-naviigo-brown/10 hover:shadow-md transition-shadow duration-300 bg-paper-warm">
                  <PlaceImage
                    name={t.name}
                    city={t.state}
                    fallbackUrl={t.image}
                    asBackground
                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-1.5 text-brand-secondary font-mono text-[10px] font-bold mb-1">
                      <span className="uppercase tracking-wider">{t.travelers}</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white tracking-tight uppercase">{t.name}</h3>
                    <p className="text-xs text-white/80 font-mono">{t.state} · {t.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ SEASONAL — Editorial Horizontal Cards ══════════════ */}
      {visibleSections >= 5 && (
        <section className="py-16 bg-paper-warm border-t border-naviigo-brown/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="mb-10">
              <div className="flex items-center gap-2 text-naviigo-orange font-mono text-xs font-semibold tracking-widest uppercase mb-3">
                <Calendar className="w-3.5 h-3.5" /> Optimal Window
              </div>
              <h2 className="text-3xl font-display font-black text-naviigo-brown tracking-tight uppercase">Seasonal Expeditions</h2>
              <p className="text-base font-light text-naviigo-text/70 mt-2">Optimal climatic conditions and regional festivals.</p>
            </div>

            <div className="space-y-4">
              {SEASONAL.map((s) => (
                <div key={s.name}
                  onClick={() => go(s.name)}
                  className="group flex flex-col md:flex-row rounded-2xl overflow-hidden bg-paper-light border border-naviigo-brown/10 shadow-sm hover:shadow-md hover:border-naviigo-orange/40 transition-all duration-300 cursor-pointer">
                  <div className="relative md:w-1/3 h-56 md:h-auto min-h-[200px] overflow-hidden">
                    <PlaceImage
                      name={s.name}
                      fallbackUrl={s.image}
                      asBackground
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 text-naviigo-brown font-mono text-[10px] px-3 py-1 rounded font-bold shadow-sm">{s.season}</div>
                  </div>
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-display font-bold text-naviigo-brown mb-2 tracking-tight uppercase">{s.name}</h3>
                    <p className="text-sm font-light text-naviigo-text/75 leading-relaxed mb-4">{s.note}</p>
                    <div className="flex items-center gap-2 font-mono text-xs text-naviigo-text/60">
                      <Users className="w-3.5 h-3.5 text-naviigo-orange" /> Best for: {s.bestFor}
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
            <div className="flex items-center gap-3 text-sm font-mono text-naviigo-text/60">
              <Loader2 className="w-5 h-5 animate-spin text-naviigo-orange" /> Loading more expeditions...
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-naviigo-brown/20 flex items-center justify-center">
              <ChevronRight className="w-3 h-3 text-naviigo-orange rotate-90" />
            </div>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      {visibleSections >= TOTAL_SECTIONS && (
        <section className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-12 sm:py-20">
          <div className="relative overflow-hidden bg-naviigo-brown rounded-3xl p-6 sm:p-10 md:p-14 text-center shadow-xl text-white">
            <h2 className="relative text-2xl sm:text-3xl md:text-4xl font-display font-black text-white mb-3 tracking-tight uppercase">Ready To Journey?</h2>
            <p className="relative text-white/75 mb-8 text-base font-light max-w-md mx-auto">Use our itinerary tools to orchestrate a personalized travel roadbook.</p>
            <Link href="/itinerary?new=true" className="relative inline-flex items-center gap-2 bg-naviigo-orange text-white px-8 py-3.5 rounded-full font-sans font-bold text-xs uppercase tracking-widest shadow-md hover:bg-white hover:text-naviigo-brown transition-all hover:scale-105">
              Start Curating
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-saffron" /></div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
