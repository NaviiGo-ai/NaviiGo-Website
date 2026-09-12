'use client';
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gem, ChevronRight, Compass, Heart, ArrowRight, Loader2, Users, Calendar, Flame, Globe, Sparkles, Sun, Waves, Mountain, Footprints } from 'lucide-react';
import {
  ALL_DESTINATIONS, HIDDEN_GEMS, CUISINES, TRENDING, SEASONAL,
  CATEGORIES,
} from '@/components/features/explore/exploreData';
import { startCityView, trackCategoryClick } from '@/lib/browsingSignals';
import { useAuth } from '@/lib/AuthContext';
import { toggleBucketListItem, getUserBucketList } from '@/lib/firestore';
import ExploreHero from '@/components/features/explore/ExploreHero';
import BentoGrid from '@/components/features/explore/BentoGrid';
import CuisineSection from '@/components/features/explore/CuisineSection';
import PlaceImage from '@/components/shared/PlaceImage';

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

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden w-full max-w-[100vw] font-sans">

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} className="relative h-[60vh] sm:h-[75vh] md:h-[85vh] min-h-[480px] sm:min-h-[560px] md:min-h-[620px] flex items-center justify-center overflow-hidden pt-20 sm:pt-28">
        {/* Parallax background — self-contained Soul of India wash, no image asset */}
        <motion.div style={{ scale: heroScale, y: heroY }} className="absolute inset-0">
          {/* Mobile wash */}
          <div
            className="absolute inset-0 pointer-events-none sm:hidden"
            style={{
              background:
                'radial-gradient(900px 520px at 78% 12%, rgba(255,153,51,0.28), transparent 62%), radial-gradient(720px 460px at 12% 86%, rgba(75,0,130,0.22), transparent 62%)',
            }}
          />
          {/* Desktop / tablet wash */}
          <div
            className="hidden sm:block absolute inset-0 pointer-events-none dark:opacity-70"
            style={{
              background:
                'radial-gradient(1200px 620px at 72% 18%, rgba(255,153,51,0.26), transparent 62%), radial-gradient(980px 540px at 18% 82%, rgba(75,0,130,0.22), transparent 62%), radial-gradient(760px 420px at 92% 88%, rgba(46,139,87,0.16), transparent 62%)',
            }}
          />
          {/* Vignette keeps foreground type legible in both themes */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background pointer-events-none" />
        </motion.div>

        {/* Content */}
        <ExploreHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={(c) => { setActiveCategory(c); trackCategoryClick(c); }}
          categoryIcons={CATEGORY_ICONS}
        />
      </section>

      {/* ══════════════ BENTO DESTINATIONS ══════════════ */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <BentoGrid
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
        <section className="relative py-12 sm:py-20 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 relative">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-saffron text-xs font-semibold tracking-widest uppercase mb-3">
                  <Gem className="w-4 h-4" /> Off the beaten path
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight font-serif">Hidden Gems</h2>
                <p className="text-base text-muted-foreground mt-2 max-w-lg font-medium">Places most travelers never find — curated for the curious soul.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HIDDEN_GEMS.map((gem, i) => {
                const isExpanded = expandedGem === gem.name;
                return (
                  <motion.div key={gem.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                    onClick={() => setExpandedGem(isExpanded ? null : gem.name)}
                    className="group cursor-pointer">
                    <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md hover:border-saffron/40 transition-all duration-300">
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
                          <span className="bg-background/90 text-foreground text-[10px] px-2.5 py-1 rounded-sm font-bold shadow-sm">{gem.crowdLevel} crowd</span>
                          <button onClick={e => { e.stopPropagation(); toggleLike({ id: gem.name, name: gem.name, state: gem.state, image: gem.image }); }}
                            className="w-7 h-7 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center z-10 transition-colors">
                            <Heart className={`w-3.5 h-3.5 transition-all ${liked.has(gem.name) ? 'fill-rose-500 text-rose-500' : 'text-white/90'}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white tracking-tight font-serif">{gem.name}</h3>
                          <span className="text-xs font-medium text-white/80">{gem.state} · Best: {gem.bestSeason}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">{gem.desc}</p>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Difficulty</span>
                                  <span className="font-semibold text-card-foreground">{gem.difficulty}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); go(gem.name); }}
                                  className="w-full bg-saffron hover:bg-saffron/90 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                  <Compass className="w-4 h-4" /> Plan This Adventure
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Click to {isExpanded ? 'collapse' : 'explore'}</span>
                          <ChevronRight className={`w-4 h-4 text-saffron transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
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
        <section className="py-10 sm:py-16 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-saffron text-xs font-semibold tracking-widest uppercase mb-3">
                  <Flame className="w-4 h-4" /> Hot right now
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-serif">Trending Destinations</h2>
              </div>
              <Link href="/itinerary?new=true" className="hidden md:flex items-center gap-1 text-sm font-semibold text-saffron hover:text-saffron/80 transition-colors">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {TRENDING.map((t, i) => (
                <div key={t.name}
                  onClick={() => go(t.name)}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-sm ring-1 ring-border hover:shadow-md transition-shadow duration-300">
                  <PlaceImage
                    name={t.name}
                    city={t.state}
                    fallbackUrl={t.image}
                    asBackground
                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-1.5 text-marigold text-[10px] font-bold mb-2">
                      <span className="uppercase tracking-wider">{t.travelers}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight font-serif">{t.name}</h3>
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
        <section className="py-16 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
            <div className="mb-10">
              <div className="flex items-center gap-2 text-saffron text-xs font-semibold tracking-widest uppercase mb-3">
                <Calendar className="w-4 h-4" /> Time-limited
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight font-serif">Seasonal Picks</h2>
              <p className="text-base font-medium text-muted-foreground mt-2">Once-a-year experiences you don&apos;t want to miss.</p>
            </div>

            <div className="space-y-4">
              {SEASONAL.map((s, i) => (
                <div key={s.name}
                  onClick={() => go(s.name)}
                  className="group flex flex-col md:flex-row rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md hover:border-saffron/40 transition-all duration-300 cursor-pointer">
                  <div className="relative md:w-1/3 h-56 md:h-auto min-h-[200px] overflow-hidden">
                    <PlaceImage
                      name={s.name}
                      fallbackUrl={s.image}
                      asBackground
                      className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-background/90 text-foreground text-[10px] px-3 py-1 rounded-sm font-bold shadow-sm">{s.season}</div>
                  </div>
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2 tracking-tight font-serif">{s.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">{s.note}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
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
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-saffron" /> Loading more...
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center">
              <ChevronRight className="w-3 h-3 text-saffron rotate-90" />
            </div>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      {visibleSections >= TOTAL_SECTIONS && (
        <section className="max-w-4xl mx-auto px-3 sm:px-4 md:px-8 py-12 sm:py-20">
          <div className="relative overflow-hidden bg-indigo rounded-3xl p-6 sm:p-10 md:p-14 text-center shadow-lg">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(700px 320px at 85% 10%, rgba(255,153,51,0.35), transparent 60%), radial-gradient(520px 300px at 5% 95%, rgba(255,193,7,0.22), transparent 60%)',
              }}
            />
            <h2 className="relative text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight font-serif">Ready to book?</h2>
            <p className="relative text-white/70 mb-8 text-base font-medium">Use our planning tools to craft the perfect itinerary.</p>
            <Link href="/itinerary?new=true" className="relative inline-flex items-center gap-2 bg-saffron text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-saffron/90 hover:scale-[1.02] transition-all">
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-saffron" /></div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
