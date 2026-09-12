'use client';

import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  Plane, Train, Car, Building2, MapPin, Calendar, Search,
  ArrowRightLeft, Star, Users, Clock, Wifi, Coffee, ShieldCheck,
  CheckCircle2, Tag, ChevronDown, Filter, Zap, TrendingDown,
  BadgePercent, Wind, Luggage, Bed, UtensilsCrossed, Dumbbell,
  SlidersHorizontal, ArrowUpDown, ThumbsUp, Bot, Bell, TrendingUp,
  Flame, Award, Timer, Shield, CircleCheck, ChevronRight, Sparkles,
  AlertTriangle, Info
} from 'lucide-react';
import PlaceAutocomplete from '@/components/shared/PlaceAutocomplete';
import TravelersSelector from '@/components/shared/TravelersSelector';
import BookingPortal from '@/components/features/bookings/BookingPortal';
import BookingTabs from '@/components/features/bookings/BookingTabs';
import FlightCard from '@/components/features/bookings/FlightCard';
import TrainCard from '@/components/features/bookings/TrainCard';
import CabCard from '@/components/features/bookings/CabCard';
import HotelCard from '@/components/features/bookings/HotelCard';
import FilterChips from '@/components/features/bookings/FilterChips';
import SortBar from '@/components/features/bookings/SortBar';

type TabType = 'flights' | 'trains' | 'cabs' | 'hotels';

// ─── DATA ────────────────────────────────────────────────────────────────────

const flightFilters = ['Non-stop', 'Morning Dep', 'Evening Dep', 'Under ₹5k', 'With Meal'];
const trainFilters = ['Sleeper', '3A', '2A', '1A', 'CC', 'Non-stop', 'Daily'];
const cabFilters = ['Sedan', 'SUV', 'Self-Drive', 'AC', 'Top Rated'];
const hotelFilters = ['Staycations & Resorts', '5 Star', '4 Star', '3 Star', 'Pool', 'Breakfast', 'Free Cancellation'];
const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Duration', 'Departure Time', 'Rating'];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function CompareBadge({ badge }: { badge: string | null }) {
  if (!badge) return null;
  const config = {
    cheapest: { icon: TrendingDown, label: '🟢 Cheapest', cls: 'bg-jungle-green-50 dark:bg-jungle-green-900/20 text-jungle-green-700 dark:text-jungle-green-400 border-jungle-green-200 dark:border-jungle-green-800/40' },
    fastest: { icon: Zap, label: '⚡ Fastest', cls: 'bg-saffron-50  dark:bg-saffron-900/20  text-saffron-700  dark:text-saffron-400  border-saffron-200  dark:border-saffron-800/40' },
    bestvalue: { icon: Award, label: '⭐ Best Value', cls: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40' },
  }[badge];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  );
}

function SmartInsights({ tab }: { tab: string }) {
  const insights: Record<string, { icon: string; text: string; type: 'info' | 'warn' | 'tip' }[]> = {
    flights: [
      { icon: '📅', text: 'April 2026 is shoulder season: Demand is moderate, offering lower fares than peak months.', type: 'tip' },
      { icon: '📉', text: 'Booking 6–8 weeks early is optimal for this route to save up to ₹2,500.', type: 'info' },
      { icon: '💡', text: 'Tuesday & Wednesday departures are consistently 12% cheaper than weekends.', type: 'tip' },
    ],
    trains: [
      { icon: '🚆', text: 'Vande Bharat CC seats are currently in high demand. Recommend booking soon.', type: 'warn' },
      { icon: '✅', text: 'Tatkal windows open at 10:00 AM daily for AC classes.', type: 'info' },
    ],
    cabs: [
      { icon: '💰', text: 'Intercity rates are stable. No surge expected for your current window.', type: 'tip' },
      { icon: '🚕', text: 'Sedans offer the best value-to-speed ratio for this distance.', type: 'info' },
    ],
    hotels: [
      { icon: '🏨', text: 'Ghat-side hotels typically reach 90% occupancy during April weekends.', type: 'warn' },
      { icon: '✨', text: 'Booking 5+ days early unlocks "Early Bird" discounts at many 4-star retreats.', type: 'tip' },
    ],
  };
  const list = insights[tab] ?? [];
  return (
    <div className="mt-6 rounded-2xl border border-muted-100 dark:border-white/5 bg-white dark:bg-[#111] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-saffron-400 to-temple-red-500 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <p className="font-bold text-sm text-muted-800 dark:text-white">Smart Price Insights</p>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-50 dark:bg-saffron-900/20 text-saffron-600 dark:text-saffron-400 border border-saffron-200 dark:border-saffron-800/30">AI Powered</span>
      </div>
      <div className="space-y-2.5">
        {list.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-sm ${ins.type === 'warn' ? 'bg-saffron-50 dark:bg-saffron-900/10 text-saffron-800 dark:text-saffron-300'
            : ins.type === 'tip' ? 'bg-jungle-green-50 dark:bg-jungle-green-900/10 text-jungle-green-800 dark:text-jungle-green-300'
              : 'bg-muted-50 dark:bg-white/5 text-muted-700 dark:text-muted-300'
            }`}>
            <span className="text-base shrink-0 mt-0.5">{ins.icon}</span>
            <p className="leading-snug font-medium">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEARCH FORMS ────────────────────────────────────────────────────────────

function FlightForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1.2fr] gap-4 items-center">
      <PlaceAutocomplete name="from" placeholder="From City" icon="plane" />

      <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-saffron-100 dark:hover:bg-saffron-900/30 transition-all shrink-0 mx-auto border border-muted-200 dark:border-muted-700 hover:rotate-180">
        <ArrowRightLeft className="w-4 h-4 text-muted-500" />
      </button>

      <PlaceAutocomplete name="to" placeholder="To City" icon="plane" />

      <div className="relative group">
        <Calendar className="absolute left-4 top-1/2 -tranmuted-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-saffron-500 transition-colors pointer-events-none" />
        <input name="date" type="date" className="input-field pl-11" />
      </div>

      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function TrainForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="from" placeholder="From Station" icon="train" />

      <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-deep-sea-100 dark:hover:bg-deep-sea-900/30 transition-all shrink-0 mx-auto border border-muted-200 dark:border-muted-700 hover:rotate-180">
        <ArrowRightLeft className="w-4 h-4 text-muted-500" />
      </button>

      <PlaceAutocomplete name="to" placeholder="To Station" icon="train" />

      <div className="relative group">
        <Calendar className="absolute left-4 top-1/2 -tranmuted-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-deep-sea-500 transition-colors pointer-events-none" />
        <input name="date" type="date" className="input-field pl-11" />
      </div>

      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function CabForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="from" placeholder="Pickup City" icon="map" />

      <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-jungle-green-100 dark:hover:bg-jungle-green-900/30 transition-all shrink-0 mx-auto border border-muted-200 dark:border-muted-700 hover:rotate-180">
        <ArrowRightLeft className="w-4 h-4 text-muted-500" />
      </button>

      <PlaceAutocomplete name="to" placeholder="Dropoff City" icon="map" />

      <div className="relative group">
        <Calendar className="absolute left-4 top-1/2 -tranmuted-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-jungle-green-500 transition-colors pointer-events-none" />
        <input name="date" type="date" className="input-field pl-11" />
      </div>

      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function HotelForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1.2fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="to" placeholder="Where are you going?" icon="map" />

      <div className="grid grid-cols-2 gap-4">
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -tranmuted-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input name="checkin" type="date" className="input-field pl-11" />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -tranmuted-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input name="checkout" type="date" className="input-field pl-11" />
        </div>
      </div>

      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const tabConfig = [
  { id: 'flights', icon: Plane, label: 'Flights', color: 'text-saffron-500', accent: 'from-saffron-500 to-temple-red-500' },
  { id: 'trains', icon: Train, label: 'Trains', color: 'text-deep-sea-500', accent: 'from-deep-sea-500 to-indigo-500' },
  { id: 'cabs', icon: Car, label: 'Cabs', color: 'text-jungle-green-500', accent: 'from-jungle-green-500 to-deep-sea-500' },
  { id: 'hotels', icon: Building2, label: 'Hotels', color: 'text-indigo-500', accent: 'from-indigo-500 to-indigo-500' },
] as const;

const filtersByTab = { flights: flightFilters, trains: trainFilters, cabs: cabFilters, hotels: hotelFilters };

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('flights');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  // Booking Portal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'flights' | 'hotels' | 'trains' | 'cabs'>('flights');
  const [travelers, setTravelers] = useState(1);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenPortal = (item: any, type: any) => {
    const enrichedItem = {
      ...item,
      _travelers: travelers,
      _date: item._date || lastQuery?.date || '',
    };
    setSelectedBooking(enrichedItem);
    setBookingType(type);
    setIsPortalOpen(true);
  };
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastQuery, setLastQuery] = useState<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setFormError(null);

    const formData = e?.currentTarget ? Object.fromEntries(new FormData(e.currentTarget)) : {};

    const normalizedDate = formData.date || formData.checkin || "";
    const from = (formData.from as string) || '';
    const to = (formData.to as string) || '';

    if (activeTab === 'hotels') {
      if (!to || !normalizedDate) {
        setFormError("Please fill in destination and check-in date.");
        return;
      }
    } else {
      if (!from || !to || !normalizedDate) {
        setFormError("Please fill in from, destination and dates.");
        return;
      }
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    const query = {
      ...formData,
      from: from || to,
      to,
      date: normalizedDate,
      type: activeTab,
      page: 1
    };

    setLastQuery(query);
    setResultsPage(1);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      const data = await res.json();
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        console.error("Search failed:", data.error);
        setFormError(data.error || "No results found for this route.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Connection error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastQuery || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = resultsPage + 1;
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastQuery, page: nextPage })
      });
      const data = await res.json();
      if (data.success && data.results && data.results.length > 0) {
        setSearchResults(prev => [...prev, ...data.results]);
        setResultsPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  useLayoutEffect(() => {
    if (isSearching || searchResults.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.result-card, .naviigo-deal',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out' }
      );
    }, listRef);
    return () => ctx.revert();
  }, [activeTab, isSearching, searchResults.length]);

  const renderForm = () => {
    if (activeTab === 'flights') return <FlightForm onTravelersChange={(val) => setTravelers(parseInt(val))} />;
    if (activeTab === 'trains') return <TrainForm onTravelersChange={(val) => setTravelers(parseInt(val))} />;
    if (activeTab === 'cabs') return <CabForm onTravelersChange={(val) => setTravelers(parseInt(val))} />;
    return <HotelForm onTravelersChange={(val) => setTravelers(parseInt(val))} />;
  };

  const renderResults = () => {
    let list = searchResults;

    if (activeTab === 'hotels' && activeFilters.includes('Staycations & Resorts')) {
        list = list.filter((h: any) => h.stars >= 4 || h.tags?.includes('Luxury') || h.name?.toLowerCase().includes('resort'));
        if (list.length === 0) {
            list = [{ id: 'staycation-1', name: 'Curated Weekend Resort & Spa', area: lastQuery?.to || 'City Center', stars: 5, price: '₹12,000', priceNum: 12000, perNight: '/night', rating: 4.9, reviews: 120, amenities: ['Spa', 'Pool', 'Breakfast'], tags: ['Staycation', 'Luxury'], image: '🌴', refundable: true, distance: 'Secluded getaway', badge: 'bestvalue', deepLink: `https://www.agoda.com/search?text=${encodeURIComponent('Resorts in ' + (lastQuery?.to || 'India'))}` }];
        }
    }

    if (list.length === 0) return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <p className="text-muted-foreground text-sm">No results found. Try a different route or date.</p>
      </motion.div>
    );
    const parsePrice = (p: any) => {
      if (typeof p === 'number') return p;
      if (!p) return 0;
      return parseInt(String(p).replace(/[^0-9]/g, '')) || 0;
    };
    const parseDuration = (d: string) => {
      const match = (d||'').match(/(\d+)h(?:\s*(\d+)m)?/);
      if (!match) return 0;
      return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
    };

    list = [...list].sort((a, b) => {
      if (sortOption === 'Price: Low to High') return parsePrice(a.price) - parsePrice(b.price);
      if (sortOption === 'Price: High to Low') return parsePrice(b.price) - parsePrice(a.price);
      if (sortOption === 'Duration') {
        const durA = parseDuration(a.duration || (a.time ? a.time.split(' - ')[0] : '0h'));
        const durB = parseDuration(b.duration || (b.time ? b.time.split(' - ')[0] : '0h'));
        return durA - durB;
      }
      if (sortOption === 'Rating') {
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      }
      return 0;
    });

    const paginated = list.slice(0, resultsPage * 10);

    if (activeTab === 'flights') return paginated.map((f, i) => <FlightCard key={f.id || i} flight={f} onBook={(item: any) => handleOpenPortal(item, 'flights')} />);
    if (activeTab === 'trains') return paginated.map((t, i) => <TrainCard key={t.id || i} train={t} onBook={(item: any) => handleOpenPortal(item, 'trains')} />);
    if (activeTab === 'cabs') return paginated.map((c, i) => <CabCard key={c.id || i} cab={c} onBook={(item: any) => handleOpenPortal(item, 'cabs')} />);
    return paginated.map((h, i) => <HotelCard key={h.id || i} hotel={h} onBook={(item: any) => handleOpenPortal(item, 'hotels')} />);
  };

  const sectionLabel = () => {
    const count = searchResults.length;
    const fromStr = lastQuery?.from || '';
    const toStr = lastQuery?.to || '';
    const route = fromStr && toStr ? ` · ${fromStr} → ${toStr}` : '';
    if (activeTab === 'flights') return `${count} flight${count !== 1 ? 's' : ''} found${route}`;
    if (activeTab === 'trains') return `${count} train${count !== 1 ? 's' : ''} found${route}`;
    if (activeTab === 'cabs') return `${count} cab${count !== 1 ? 's' : ''} available${route}`;
    return `${count} hotel${count !== 1 ? 's' : ''} found${route}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 pb-24 px-4 sm:px-6 md:px-10 font-sans">
      <style>{`
        .input-field {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: 0.875rem;
          padding: 0.875rem 1rem;
          outline: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          color: var(--foreground);
        }
        input[type="date"] {
          padding-left: 2.75rem !important;
          display: flex;
          align-items: center;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
        input[type="date"]::-webkit-inner-spin-button,
        input[type="date"]::-webkit-clear-button {
          display: none;
          -webkit-appearance: none;
        }
        .input-field:focus { border-color: var(--primary); background: var(--card); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>

      <div className="max-w-6xl mx-auto">

        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-serif">
            Book Your <span className="text-primary">Travel</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Compare prices across <span className="font-semibold text-foreground">50+ travel platforms</span> · Powered by NaviiGo</p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap justify-center items-center p-1.5 bg-card border border-border rounded-2xl shadow-sm gap-1 sm:gap-0">
            {tabConfig.map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Modules Container */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[1.75rem] overflow-hidden bg-card border border-border shadow-xl p-4 sm:p-6"
        >
          {/* TravelPayouts Metasearch Widget */}
          <div className={activeTab === 'flights' ? 'block' : 'hidden'}>
            <div id="tpwl-search">
              <div className="w-full h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl animate-pulse">
                <Plane className="w-8 h-8 mb-3 opacity-50 text-primary" />
                <p>Initializing Global Flight Search Engine...</p>
              </div>
            </div>
          </div>

          {/* Native NaviiGo Forms */}
          {activeTab !== 'flights' && (
            <form onSubmit={handleSearch}>
              {renderForm()}
              <FilterChips options={filtersByTab[activeTab]} active={activeFilters} onToggle={toggleFilter} />

              {formError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </motion.div>
              )}

              <div className="mt-6 flex justify-center">
                <button type="submit" disabled={isSearching} className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 shadow-md">
                  {isSearching ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                  {isSearching ? 'Searching...' : `Search ${tabConfig.find(t => t.id === activeTab)?.label}`}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* TravelPayouts Search Results (Only for Flights) */}
        <div className={`mb-8 ${activeTab === 'flights' ? 'block' : 'hidden'}`}>
          <div id="tpwl-tickets"></div>
        </div>

        {/* Native NaviiGo Results (For Trains, Cabs, Hotels) */}
        {activeTab !== 'flights' && (
          <div ref={listRef} className="space-y-4">
            {isSearching ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-muted-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-muted-100 dark:bg-muted-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted-100 dark:bg-muted-800 rounded-full animate-pulse w-32" />
                      <div className="h-2.5 bg-muted-100 dark:bg-muted-800 rounded-full animate-pulse w-20" />
                    </div>
                    <div className="h-8 w-24 bg-muted-100 dark:bg-muted-800 rounded-xl animate-pulse" />
                  </div>
                  <div className="flex justify-center gap-8">
                    <div className="h-8 w-12 bg-muted-100 dark:bg-muted-800 rounded animate-pulse" />
                    <div className="flex-1 h-px bg-muted-100 dark:bg-muted-800 self-center animate-pulse" />
                    <div className="h-8 w-12 bg-muted-100 dark:bg-muted-800 rounded animate-pulse" />
                  </div>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-muted-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted-100 dark:bg-muted-800 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted-100 dark:bg-muted-800 rounded-full animate-pulse" style={{ width: `${50 + i * 10}%` }} />
                        <div className="h-2.5 bg-muted-100 dark:bg-muted-800 rounded-full animate-pulse w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-5 w-20 bg-muted-100 dark:bg-muted-800 rounded animate-pulse" />
                        <div className="h-8 w-24 bg-muted-100 dark:bg-muted-800 rounded-xl animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-muted-400 animate-pulse pt-2">🔍 Searching 120+ sites for the best deals…</p>
              </div>
            ) : !hasSearched ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center opacity-70"
              >
                <div className="w-20 h-20 bg-muted-100 dark:bg-muted-800/50 rounded-full flex items-center justify-center mb-5">
                  <Search className="w-8 h-8 text-muted-400" />
                </div>
                <h3 className="text-xl font-bold text-muted-800 dark:text-white mb-2">Ready to explore?</h3>
                <p className="text-sm text-muted-500 max-w-[300px]">Enter your destination and dates above to unlock live deals and dynamic routes.</p>
              </motion.div>
            ) : (
              <>
                <SortBar label={sectionLabel()} sort={sortOption} onSortChange={setSortOption} />
                {renderResults()}
                <SmartInsights tab={activeTab} />
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-muted-200 dark:border-muted-700 text-muted-500 dark:text-muted-400 hover:border-saffron-400 hover:text-saffron-500 dark:hover:border-saffron-600 dark:hover:text-saffron-400 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                  >
                    <BadgePercent className="w-4 h-4" />
                    {loadingMore ? 'Loading...' : 'Load more results'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isPortalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <BookingPortal
          isOpen={isPortalOpen}
          onClose={() => setIsPortalOpen(false)}
          selectedItem={selectedBooking}
          bookingType={bookingType}
          travelersCount={travelers}
        />,
        document.body
      )}
    </div>
  );
}
