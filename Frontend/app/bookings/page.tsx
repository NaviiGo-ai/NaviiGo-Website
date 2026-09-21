'use client';

import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  Plane, Train, Car, Building2, MapPin, Calendar, Search,
  ArrowRightLeft, Star, Users, Clock, ShieldCheck,
  CheckCircle2, ChevronRight, AlertTriangle, FileText, ArrowRight
} from 'lucide-react';
import PlaceAutocomplete from '@/components/shared/PlaceAutocomplete';
import TravelersSelector from '@/components/shared/TravelersSelector';
import BookingPortal from '@/components/features/bookings/BookingPortal';
import FlightCard from '@/components/features/bookings/FlightCard';
import TrainCard from '@/components/features/bookings/TrainCard';
import CabCard from '@/components/features/bookings/CabCard';
import HotelCard from '@/components/features/bookings/HotelCard';
import FilterChips from '@/components/features/bookings/FilterChips';
import SortBar from '@/components/features/bookings/SortBar';

type TabType = 'flights' | 'trains' | 'cabs' | 'hotels';
type WalletView = 'all' | 'upcoming' | 'action' | 'past';

// ─── CONFIRMED TRAVEL DOCUMENTS INTERFACE ────────────────────────────────────
interface TravelDoc {
  id: string;
  type: 'flight' | 'train' | 'hotel' | 'cab';
  category: 'upcoming' | 'past' | 'action_required';
  title: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  reference: string;
  operator: string;
  statusLabel: string;
  seatOrRoom?: string;
  amount: string;
}

// Documents are loaded from real user bookings only — never seeded with fabricated reservations.

// ─── SEARCH FILTERS ────────────────────────────────────────────────────────────
const flightFilters = ['Non-stop', 'Morning Dep', 'Evening Dep', 'Under ₹5k', 'With Meal'];
const trainFilters = ['Sleeper', '3A', '2A', '1A', 'CC', 'Non-stop', 'Daily'];
const cabFilters = ['Sedan', 'SUV', 'Self-Drive', 'AC', 'Top Rated'];
const hotelFilters = ['Staycations & Resorts', '5 Star', '4 Star', '3 Star', 'Pool', 'Breakfast', 'Free Cancellation'];
const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Duration', 'Departure Time', 'Rating'];

function SmartInsights({ tab }: { tab: string }) {
  const insights: Record<string, { note: string; sub: string }[]> = {
    flights: [
      { note: 'Spring shoulder season provides 15% lower fares than mid-summer peak.', sub: 'Route telemetry recommends morning departures.' },
      { note: 'Booking 6–8 weeks in advance preserves verified window seating.', sub: 'Direct flight frequency is optimal on weekdays.' },
    ],
    trains: [
      { note: 'Executive CC and 2A inventory opens 120 days prior to departure.', sub: 'Confirmed berth allocations fill rapidly on northern corridors.' },
    ],
    cabs: [
      { note: 'Fixed intercity tariff applies with zero dynamic surge on confirmed bookings.', sub: 'Verified hill-certified chauffeurs assigned for mountain routes.' },
    ],
    hotels: [
      { note: 'Heritage estates require advance reservation for panoramic courtyard rooms.', sub: 'Complimentary early baggage hold included in all partner dossiers.' },
    ],
  };
  const list = insights[tab] ?? [];
  return (
    <div className="mt-8 rounded-xl border border-[#EADFD4] bg-paper-light p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
        <h4 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest flex items-center gap-2">
          <span>✦ ROUTE INTELLIGENCE & DISPATCH</span>
        </h4>
        <span className="font-mono text-[10px] text-naviigo-brown/50">OPERATIONAL GUIDANCE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((ins, i) => (
          <div key={i} className="bg-paper-warm rounded-lg p-3.5 border border-[#EADFD4]">
            <p className="font-sans text-xs text-naviigo-brown leading-relaxed font-medium">{ins.note}</p>
            <p className="font-mono text-[10px] text-naviigo-brown/60 mt-1 uppercase">{ins.sub}</p>
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
      <PlaceAutocomplete name="from" placeholder="Origin Airport or City" icon="plane" />
      <button type="button" className="flex items-center justify-center w-9 h-9 rounded-full bg-paper-warm hover:bg-paper-light transition-all shrink-0 mx-auto border border-[#EADFD4]">
        <ArrowRightLeft className="w-3.5 h-3.5 text-naviigo-brown/60" />
      </button>
      <PlaceAutocomplete name="to" placeholder="Destination Airport or City" icon="plane" />
      <div className="relative group">
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-naviigo-brown/40 pointer-events-none" />
        <input name="date" type="date" className="input-field pl-10 font-mono text-xs uppercase" />
      </div>
      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function TrainForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="from" placeholder="Origin Station" icon="train" />
      <button type="button" className="flex items-center justify-center w-9 h-9 rounded-full bg-paper-warm hover:bg-paper-light transition-all shrink-0 mx-auto border border-[#EADFD4]">
        <ArrowRightLeft className="w-3.5 h-3.5 text-naviigo-brown/60" />
      </button>
      <PlaceAutocomplete name="to" placeholder="Destination Station" icon="train" />
      <div className="relative group">
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-naviigo-brown/40 pointer-events-none" />
        <input name="date" type="date" className="input-field pl-10 font-mono text-xs uppercase" />
      </div>
      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function CabForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="from" placeholder="Pickup City or Point" icon="map" />
      <button type="button" className="flex items-center justify-center w-9 h-9 rounded-full bg-paper-warm hover:bg-paper-light transition-all shrink-0 mx-auto border border-[#EADFD4]">
        <ArrowRightLeft className="w-3.5 h-3.5 text-naviigo-brown/60" />
      </button>
      <PlaceAutocomplete name="to" placeholder="Drop-off Destination" icon="map" />
      <div className="relative group">
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-naviigo-brown/40 pointer-events-none" />
        <input name="date" type="date" className="input-field pl-10 font-mono text-xs uppercase" />
      </div>
      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

function HotelForm({ onTravelersChange }: { onTravelersChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1.2fr_1fr] gap-4 items-center">
      <PlaceAutocomplete name="to" placeholder="Destination City or Territory" icon="map" />
      <div className="grid grid-cols-2 gap-3">
        <div className="relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-naviigo-brown/40 pointer-events-none" />
          <input name="checkin" type="date" className="input-field pl-9 font-mono text-xs uppercase" />
        </div>
        <div className="relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-naviigo-brown/40 pointer-events-none" />
          <input name="checkout" type="date" className="input-field pl-9 font-mono text-xs uppercase" />
        </div>
      </div>
      <TravelersSelector onSelect={onTravelersChange} />
    </div>
  );
}

const tabConfig = [
  { id: 'flights', icon: Plane, label: 'Flights' },
  { id: 'trains', icon: Train, label: 'Trains' },
  { id: 'cabs', icon: Car, label: 'Cabs' },
  { id: 'hotels', icon: Building2, label: 'Hotels' },
] as const;

const filtersByTab = { flights: flightFilters, trains: trainFilters, cabs: cabFilters, hotels: hotelFilters };

export default function BookingsPage() {
  const [activeMainSection, setActiveMainSection] = useState<'wallet' | 'search'>('wallet');
  const [walletFilter, setWalletFilter] = useState<WalletView>('all');
  const [walletDocs, setWalletDocs] = useState<TravelDoc[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('naviigo_wallet_docs');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

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
        setFormError("Please provide destination and check-in date.");
        return;
      }
    } else {
      if (!from || !to || !normalizedDate) {
        setFormError("Please provide origin, destination, and transit date.");
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
      checkout: (formData.checkout as string) || undefined,
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
        setFormError(data.error || "No verified results found for this route.");
      }
    } catch (err) {
      setFormError("Connection interrupted. Please reattempt.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDoc = (doc: TravelDoc) => {
    alert(`Travel Document ${doc.reference} (${doc.title}) opened for inspection.`);
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
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: 'power2.out' }
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
    }

    if (list.length === 0) return (
      <div className="text-center py-12 bg-paper-light rounded-xl border border-[#EADFD4]">
        <p className="font-mono text-xs text-naviigo-brown/60 uppercase">No scheduled services found for this date. Adjust date or route corridor.</p>
      </div>
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
    if (activeTab === 'flights') return `${count} flight option${count !== 1 ? 's' : ''}${route}`;
    if (activeTab === 'trains') return `${count} train route${count !== 1 ? 's' : ''}${route}`;
    if (activeTab === 'cabs') return `${count} cab transfer${count !== 1 ? 's' : ''}${route}`;
    return `${count} verified stay${count !== 1 ? 's' : ''}${route}`;
  };

  const filteredWalletDocs = walletDocs.filter(d => {
    if (walletFilter === 'all') return true;
    if (walletFilter === 'upcoming') return d.category === 'upcoming';
    if (walletFilter === 'action') return d.category === 'action_required';
    if (walletFilter === 'past') return d.category === 'past';
    return true;
  });

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-24 sm:pt-32 pb-24 px-4 sm:px-6 md:px-10 font-sans selection:bg-brand-primary selection:text-white">
      <style>{`
        .input-field {
          width: 100%;
          background: #FAF6F0;
          border: 1px solid #EADFD4;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          outline: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          color: #632713;
        }
        input[type="date"] {
          padding-left: 2.5rem !important;
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
        .input-field:focus { border-color: #EC6426; background: #FDFBF7; }
      `}</style>

      <div className="max-w-6xl mx-auto">

        {/* ── TRAVEL DOCUMENT MASTHEAD ─────────────────────────────────────────── */}
        <div className="mb-8 border-b border-[#EADFD4] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary flex items-center gap-2">
              <span>05 / TRAVEL DOCUMENT SYSTEM</span>
              <span className="text-naviigo-brown/30">·</span>
              <span className="text-naviigo-brown/60">WALLET & DISPATCH</span>
            </div>
            <div className="font-mono text-[11px] text-naviigo-brown/50 uppercase">
              CERTIFIED WAYPOINT REGISTRY
            </div>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-naviigo-brown">
            DOCUMENT WALLET.
          </h1>
          <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 mt-2 max-w-xl">
            Organized transport manifests, hotel confirmations, boarding passes, and direct transit bookings.
          </p>
        </div>

        {/* ── MODE SELECTOR: WALLET vs. TRANSIT SEARCH ─────────────────────────── */}
        <div className="flex items-center gap-4 sm:gap-6 mb-8 border-b border-[#EADFD4] pb-3 font-mono text-xs uppercase tracking-wider overflow-x-auto no-scrollbar touch-pan-x">
          <button
            onClick={() => setActiveMainSection('wallet')}
            className={`relative py-1 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] touch-manipulation shrink-0 ${
              activeMainSection === 'wallet' ? 'text-brand-primary font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Wallet ({walletDocs.length})</span>
            {activeMainSection === 'wallet' && (
              <motion.div layoutId="activeMainSection" className="absolute -bottom-3 left-0 right-0 h-[2px] bg-brand-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveMainSection('search')}
            className={`relative py-1 flex items-center gap-2 transition-colors whitespace-nowrap min-h-[44px] touch-manipulation shrink-0 ${
              activeMainSection === 'search' ? 'text-brand-primary font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Transit Search &amp; Booking</span>
            {activeMainSection === 'search' && (
              <motion.div layoutId="activeMainSection" className="absolute -bottom-3 left-0 right-0 h-[2px] bg-brand-primary" />
            )}
          </button>
        </div>

        {/* ── SECTION 1: TRAVEL DOCUMENT WALLET ─────────────────────────────────── */}
        {activeMainSection === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-paper-light border border-[#EADFD4] rounded-xl p-3 sm:p-3.5">
              <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto no-scrollbar touch-pan-x w-full sm:w-auto">
                {(['all', 'upcoming', 'action', 'past'] as const).map(cat => {
                  const isActive = walletFilter === cat;
                  const labels = {
                    all: 'ALL DOCUMENTS',
                    upcoming: 'UPCOMING',
                    action: 'ACTION REQUIRED',
                    past: 'CONCLUDED'
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => setWalletFilter(cat)}
                      className={`px-3 py-1.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 min-h-[36px] touch-manipulation ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'bg-paper-warm text-naviigo-brown/70 hover:text-naviigo-brown border border-[#EADFD4]'
                      }`}
                    >
                      {labels[cat]}
                    </button>
                  );
                })}
              </div>
              <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">
                {filteredWalletDocs.length} REGISTERED FILES
              </div>
            </div>

            {/* Travel Documents Geometry */}
            {filteredWalletDocs.length === 0 ? (
              <div className="text-center py-20 px-6 bg-paper-light rounded-2xl border border-[#EADFD4]">
                <div className="w-14 h-14 rounded-full bg-paper-warm border border-[#EADFD4] flex items-center justify-center mx-auto mb-4 text-naviigo-brown/60">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary mb-2">
                  NO BOOKINGS REGISTERED
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase mb-3">
                  Nothing here yet.
                </h3>
                <p className="font-sans text-sm text-naviigo-brown/70 max-w-md mx-auto mb-6 leading-relaxed font-light">
                  When you add a booking or reserve transit corridors through Naviigo, your verified tickets, reservations, and boarding passes stay organized here.
                </p>
                <button
                  onClick={() => setActiveMainSection('search')}
                  className="px-6 py-3 rounded-lg bg-brand-primary text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-brand-primary/90 transition-colors shadow-sm"
                >
                  Explore Transit Corridors ➔
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWalletDocs.map(doc => {
                  const isUpcoming = doc.category === 'upcoming';
                  const isAction = doc.category === 'action_required';
                  return (
                    <div
                      key={doc.id}
                      className="bg-paper-light rounded-xl border border-[#EADFD4] p-5 sm:p-6 hover:border-brand-primary/50 transition-all shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#EADFD4] pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-naviigo-brown/60 uppercase tracking-widest">
                            REF · {doc.reference}
                          </span>
                          <span className="text-naviigo-brown/30">|</span>
                          <span className="font-mono text-[10px] text-naviigo-brown/60 uppercase">
                            {doc.operator}
                          </span>
                        </div>
                        <div>
                          {isUpcoming && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-naviigo-teal/10 text-naviigo-teal border border-naviigo-teal/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-naviigo-teal" />
                              {doc.statusLabel}
                            </span>
                          )}
                          {isAction && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                              {doc.statusLabel}
                            </span>
                          )}
                          {!isUpcoming && !isAction && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-wider bg-paper-warm text-naviigo-brown/60 border border-[#EADFD4]">
                              {doc.statusLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-center">
                        <div>
                          <div className="flex items-baseline gap-3 mb-1">
                            <span className="font-mono text-lg font-bold text-naviigo-brown tracking-tight">{doc.origin}</span>
                            <span className="font-mono text-xs text-naviigo-brown/40">→</span>
                            <span className="font-mono text-lg font-bold text-naviigo-brown tracking-tight">{doc.destination}</span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-naviigo-brown uppercase truncate">{doc.title}</h4>
                        </div>

                        <div>
                          <div className="font-mono text-xs font-bold text-naviigo-brown">{doc.date}</div>
                          <div className="font-mono text-[10px] text-naviigo-brown/60">{doc.time}</div>
                        </div>

                        <div>
                          <div className="font-mono text-xs font-bold text-brand-primary">{doc.amount}</div>
                          {doc.seatOrRoom && (
                            <div className="font-mono text-[10px] text-naviigo-brown/60 uppercase">{doc.seatOrRoom}</div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          {isAction ? (
                            <button
                              onClick={() => handleViewDoc(doc)}
                              className="px-4 py-2 bg-brand-primary text-white font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-brand-primary/90 transition-colors shadow-sm"
                            >
                              Resolve Action ➔
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewDoc(doc)}
                              className="px-4 py-2 bg-paper-warm text-naviigo-brown border border-[#EADFD4] hover:border-brand-primary/40 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors"
                            >
                              View Document ➔
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 2: TRANSIT SEARCH & RESERVATIONS ─────────────────────────── */}
        {activeMainSection === 'search' && (
          <div>
            {/* Transit Category Tabs */}
            <div className="flex justify-center mb-6 overflow-x-auto no-scrollbar touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="inline-flex items-center p-1 bg-paper-light border border-[#EADFD4] rounded-lg shadow-sm shrink-0">
                {tabConfig.map(t => {
                  const isActive = activeTab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded font-mono text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all min-h-[40px] touch-manipulation whitespace-nowrap ${
                        isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-naviigo-brown/70 hover:text-naviigo-brown hover:bg-paper-warm'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Modules Container */}
            <div className="mb-8 rounded-xl bg-paper-light border border-[#EADFD4] shadow-sm p-5 sm:p-6">
              {/* Flights Metasearch */}
              <div className={activeTab === 'flights' ? 'block' : 'hidden'}>
                <div id="tpwl-search">
                  <div className="w-full h-[240px] flex flex-col items-center justify-center text-naviigo-brown/60 bg-paper-warm rounded-lg border border-[#EADFD4]">
                    <Plane className="w-8 h-8 mb-3 opacity-60 text-brand-primary" />
                    <p className="font-mono text-xs uppercase tracking-wider">Aviation Routing Engine Ready</p>
                  </div>
                </div>
              </div>

              {/* Native NaviiGo Forms */}
              {activeTab !== 'flights' && (
                <form onSubmit={handleSearch}>
                  {renderForm()}
                  <div className="mt-4 pt-4 border-t border-[#EADFD4]">
                    <FilterChips options={filtersByTab[activeTab]} active={activeFilters} onToggle={toggleFilter} />
                  </div>

                  {formError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-mono font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {formError}
                    </motion.div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-primary text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-brand-primary/90 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                      {isSearching ? 'Dispatching Query...' : `Query ${tabConfig.find(t => t.id === activeTab)?.label} →`}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* TravelPayouts Search Results (Flights) */}
            <div className={`mb-8 ${activeTab === 'flights' ? 'block' : 'hidden'}`}>
              <div id="tpwl-tickets" />
            </div>

            {/* Native NaviiGo Results */}
            {activeTab !== 'flights' && (
              <div ref={listRef} className="space-y-4">
                {isSearching ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-paper-light rounded-xl p-5 border border-[#EADFD4] animate-pulse">
                        <div className="h-4 bg-[#EADFD4] rounded w-48 mb-2" />
                        <div className="h-3 bg-[#EADFD4] rounded w-32" />
                      </div>
                    ))}
                  </div>
                ) : !hasSearched ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-paper-light rounded-xl border border-[#EADFD4]">
                    <div className="w-12 h-12 bg-paper-warm rounded-full border border-[#EADFD4] flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-naviigo-brown/50" />
                    </div>
                    <h3 className="font-display font-bold text-base text-naviigo-brown uppercase mb-1">Transit Directory Standby</h3>
                    <p className="font-sans text-xs text-naviigo-brown/60 max-w-sm">Enter route waypoints and scheduled date to access verified fares and availability.</p>
                  </div>
                ) : (
                  <>
                    <SortBar label={sectionLabel()} sort={sortOption} onSortChange={setSortOption} />
                    {renderResults()}
                    <SmartInsights tab={activeTab} />
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-lg border border-[#EADFD4] bg-paper-light text-naviigo-brown font-mono text-xs uppercase font-bold tracking-wider hover:border-brand-primary/50 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? 'Retrieving Records...' : 'Load Additional Fares ↓'}
                      </button>
                    </div>
                  </>
                )}
              </div>
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
