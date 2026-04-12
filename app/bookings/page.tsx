'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type TabType = 'flights' | 'trains' | 'cabs' | 'hotels';

// ─── DATA ────────────────────────────────────────────────────────────────────

const naviigoDeals = {
  flights: { label: 'NaviiGo Exclusive Deal', provider: 'IndiGo 6E-201', price: '₹4,150', originalPrice: '₹5,990', discount: '31% OFF', coupon: 'NAVIIFLY', tag: 'Cheapest on Web', savings: '₹1,840 saved' },
  trains: { label: 'NaviiGo Confirmed Berth', provider: 'Vande Bharat Exp (22435)', price: '₹1,195', originalPrice: '₹1,580', discount: '24% OFF', coupon: 'NAVIITRAIN', tag: 'Zero Cancellation Fee', savings: '₹385 saved' },
  cabs: { label: 'NaviiGo Intercity Cab', provider: 'Toyota Innova Crysta', price: '₹2,499', originalPrice: '₹3,200', discount: '22% OFF', coupon: 'NAVIICAB', tag: 'Fixed Price Guaranteed', savings: '₹701 saved' },
  hotels: { label: 'NaviiGo Hotel Deal', provider: 'Taj Nadesar Palace', price: '₹12,500', originalPrice: '₹18,500', discount: '32% OFF', coupon: 'NAVIIHOTEL', tag: 'Free Breakfast Included', savings: '₹6,000 saved' },
};

const flightResults = [
  { airline: 'IndiGo', code: '6E-345', from: 'DEL', to: 'VNS', dep: '06:15', arr: '07:45', duration: '1h 30m', stops: 'Non-stop', price: '₹4,850', priceNum: 4850, class: 'Economy', seats: '4 seats left', tags: ['Fastest'], logo: '🔵', badge: 'cheapest', priceDiff: null },
  { airline: 'Air India', code: 'AI-403', from: 'DEL', to: 'VNS', dep: '09:00', arr: '10:35', duration: '1h 35m', stops: 'Non-stop', price: '₹5,200', priceNum: 5200, class: 'Economy', seats: '12 seats', tags: ['Full Meal'], logo: '🔴', badge: 'bestvalue', priceDiff: '₹350 more' },
  { airline: 'SpiceJet', code: 'SG-118', from: 'DEL', to: 'VNS', dep: '13:20', arr: '15:05', duration: '1h 45m', stops: 'Non-stop', price: '₹4,990', priceNum: 4990, class: 'Economy', seats: '8 seats', tags: [], logo: '🟠', badge: null, priceDiff: '₹140 more' },
  { airline: 'Vistara', code: 'UK-779', from: 'DEL', to: 'VNS', dep: '17:45', arr: '19:20', duration: '1h 35m', stops: 'Non-stop', price: '₹6,100', priceNum: 6100, class: 'Business', seats: '2 seats left', tags: ['Business Class'], logo: '🟣', badge: null, priceDiff: '₹1,250 more' },
];

const trainResults = [
  { name: 'Vande Bharat Express', number: '22435', from: 'NDLS', to: 'BSB', dep: '06:00', arr: '14:00', duration: '8h 00m', class: 'CC / EC', price: '₹1,450', priceNum: 1450, avail: 'Available', tags: ['Fastest', 'Premium'], days: 'Daily', badge: 'fastest', priceDiff: '₹930 more than cheapest' },
  { name: 'Shiv Ganga Express', number: '12560', from: 'NDLS', to: 'BSB', dep: '20:05', arr: '06:10+1', duration: '10h 05m', class: '3A / SL', price: '₹895', priceNum: 895, avail: 'RAC 12', tags: ['Budget'], days: 'Daily', badge: 'cheapest', priceDiff: null },
  { name: 'Rajdhani Express', number: '12381', from: 'NDLS', to: 'BSB', dep: '18:55', arr: '07:00+1', duration: '12h 05m', class: '1A / 2A / 3A', price: '₹2,150', priceNum: 2150, avail: 'Available', tags: ['Premium', 'Meals Included'], days: 'Mon,Wed,Fri,Sun', badge: 'bestvalue', priceDiff: '₹1,255 more' },
  { name: 'Poorva Express', number: '12303', from: 'NDLS', to: 'BSB', dep: '08:35', arr: '22:55', duration: '14h 20m', class: '3A / SL / 2S', price: '₹520', priceNum: 520, avail: 'Available', tags: ['Budget'], days: 'Tue,Thu,Sat', badge: null, priceDiff: '₹375 less than avg' },
];

const cabResults = [
  { provider: 'Ola Outstation', type: 'Innova Crysta', category: 'SUV', pax: '6+1', price: '₹3,200', priceNum: 3200, perKm: '₹14/km', eta: '8 mins away', features: ['AC', 'GPS', 'Free Cancellation'], tags: ['Top Rated'], rating: 4.8, trips: '12.4k', badge: 'bestvalue' },
  { provider: 'Uber', type: 'Toyota Etios', category: 'Sedan', pax: '4+1', price: '₹2,800', priceNum: 2800, perKm: '₹12/km', eta: '5 mins away', features: ['AC', 'GPS'], tags: [], rating: 4.5, trips: '8.9k', badge: 'cheapest' },
  { provider: 'Meru Cabs', type: 'Honda City', category: 'Sedan', pax: '4+1', price: '₹2,950', priceNum: 2950, perKm: '₹13/km', eta: '12 mins away', features: ['AC', 'GPS', 'Free Water'], tags: ['Professional Driver'], rating: 4.7, trips: '6.2k', badge: null },
  { provider: 'Zoomcar Self Drive', type: 'Maruti Swift', category: 'Hatchback', pax: '4+1', price: '₹1,800', priceNum: 1800, perKm: '₹0 (140km incl.)', eta: 'Book 2hrs ahead', features: ['AC', 'Self-Drive', 'Insurance'], tags: ['Self Drive'], rating: 4.3, trips: '3.1k', badge: null },
];

const hotelResults = [
  { name: 'Taj Nadesar Palace', area: 'Varanasi Cantt', stars: 5, price: '₹18,500', priceNum: 18500, perNight: '/night', rating: 4.9, reviews: 2840, amenities: ['Free Breakfast', 'Pool', 'Spa', 'Wifi', 'Gym'], tags: ['Luxury', 'Heritage'], image: '🏯', refundable: true, distance: '4.2 km from Ghats', badge: 'bestvalue' },
  { name: 'BrijRama Palace', area: 'Darbhanga Ghat', stars: 5, price: '₹15,200', priceNum: 15200, perNight: '/night', rating: 4.8, reviews: 1920, amenities: ['Breakfast', 'River View', 'Wifi', 'Spa'], tags: ['Best Location', 'Ghat View'], image: '🏛️', refundable: true, distance: 'On the Ghat', badge: null },
  { name: 'Ramada by Wyndham', area: 'Cantonment Road', stars: 4, price: '₹6,800', priceNum: 6800, perNight: '/night', rating: 4.5, reviews: 1145, amenities: ['Breakfast', 'Pool', 'Wifi', 'Gym'], tags: ['Business Friendly'], image: '🏨', refundable: true, distance: '5.8 km from Ghats', badge: null },
  { name: 'Hotel Surya', area: 'Godaulia', stars: 3, price: '₹2,200', priceNum: 2200, perNight: '/night', rating: 4.2, reviews: 876, amenities: ['Wifi', 'Restaurant', 'AC'], tags: ['Budget', 'City Center'], image: '🏩', refundable: false, distance: '0.8 km from Ghats', badge: 'cheapest' },
];

const popularRoutes = {
  flights: ['DEL → BOM', 'BLR → GOA', 'DEL → VNS', 'BOM → DXB', 'CCU → DEL'],
  trains: ['NDLS → BSB', 'CSMT → PUNE', 'MAS → SBC', 'HWH → PNBE', 'DEL → JAT'],
  cabs: ['Airport → City', 'City → Ghats', 'Hotel → Station', 'Return Trip'],
  hotels: ['Varanasi', 'Goa', 'Jaipur', 'Manali', 'Ooty'],
};

const flightFilters = ['Non-stop', 'Morning Dep', 'Evening Dep', 'Under ₹5k', 'With Meal'];
const trainFilters = ['Sleeper', '3A', '2A', '1A', 'CC', 'Non-stop', 'Daily'];
const cabFilters = ['Sedan', 'SUV', 'Self-Drive', 'AC', 'Top Rated'];
const hotelFilters = ['5 Star', '4 Star', '3 Star', 'Pool', 'Breakfast', 'Ghat View', 'Free Cancellation'];

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function FilterChips({ options, active, onToggle }: { options: string[], active: string[], onToggle: (f: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {options.map(f => (
        <button
          key={f}
          onClick={() => onToggle(f)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${active.includes(f)
            ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30'
            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-orange-300 dark:hover:border-orange-700'
            }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Duration', 'Departure Time', 'Rating'];

function SortBar({ label }: { label: string }) {
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between py-3 px-1 relative">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
        <SlidersHorizontal className="w-3.5 h-3.5" />{label}
      </p>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
        >
          <ArrowUpDown className="w-3.5 h-3.5" /> {sort}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 z-50 overflow-hidden min-w-[200px]"
            >
              {SORT_OPTIONS.map(o => (
                <button
                  key={o}
                  onClick={() => { setSort(o); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${sort === o ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                >{o}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CompareBadge({ badge }: { badge: string | null }) {
  if (!badge) return null;
  const config = {
    cheapest: { icon: TrendingDown, label: '🟢 Cheapest', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
    fastest: { icon: Zap, label: '⚡ Fastest', cls: 'bg-amber-50  dark:bg-amber-900/20  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-800/40' },
    bestvalue: { icon: Award, label: '⭐ Best Value', cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/40' },
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
      { icon: '📈', text: 'Prices for DEL → VNS typically rise 15% in the next 2 days.', type: 'warn' },
      { icon: '✅', text: 'Best time to book this route: Today. Fares are near their weekly low.', type: 'tip' },
      { icon: '💡', text: 'Booking early morning flights saves on average ₹400 vs peak slots.', type: 'info' },
    ],
    trains: [
      { icon: '🚆', text: 'Vande Bharat seats fill up fast — only 4 CC seats remain for this date.', type: 'warn' },
      { icon: '✅', text: 'Booking 3–7 days ahead is optimal for this route.', type: 'tip' },
    ],
    cabs: [
      { icon: '💡', text: 'SUV prices trend ₹200 higher on weekends. Book now to lock the rate.', type: 'info' },
      { icon: '✅', text: 'Surge pricing not active right now — best window to book.', type: 'tip' },
    ],
    hotels: [
      { icon: '📅', text: 'Varanasi hotel rates spike 28% during Dev Deepawali (Nov 5–6).', type: 'warn' },
      { icon: '✅', text: 'Booking 5+ days early saves an average of ₹2,100 per night.', type: 'tip' },
    ],
  };
  const list = insights[tab] ?? [];
  return (
    <div className="mt-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#111] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <p className="font-bold text-sm text-slate-800 dark:text-white">Smart Price Insights</p>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30">AI Powered</span>
      </div>
      <div className="space-y-2.5">
        {list.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-sm ${ins.type === 'warn' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300'
            : ins.type === 'tip' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300'
              : 'bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-300'
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

function FlightForm() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_auto] gap-3 items-center">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="New Delhi (DEL)" placeholder="From" />
      </div>
      <button className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors shrink-0 mx-auto">
        <ArrowRightLeft className="w-4 h-4 text-zinc-500" />
      </button>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="Varanasi (VNS)" placeholder="To" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="date" className="input-field pl-10" />
      </div>
      <div className="relative">
        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <select className="input-field pl-10 pr-8 appearance-none">
          <option>1 Adult · Economy</option>
          <option>2 Adults · Economy</option>
          <option>2 Adults · Business</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );
}

function TrainForm() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-3 items-center">
      <div className="relative">
        <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="New Delhi (NDLS)" placeholder="From Station" />
      </div>
      <button className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors shrink-0 mx-auto">
        <ArrowRightLeft className="w-4 h-4 text-zinc-500" />
      </button>
      <div className="relative">
        <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="Varanasi (BSB)" placeholder="To Station" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="date" className="input-field pl-10" />
      </div>
      <div className="relative">
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <select className="input-field pr-8 appearance-none">
          <option>All Classes</option>
          <option>Sleeper (SL)</option>
          <option>3rd AC (3A)</option>
          <option>2nd AC (2A)</option>
          <option>1st AC (1A)</option>
          <option>Chair Car (CC)</option>
        </select>
      </div>
    </div>
  );
}

function CabForm() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-3 items-center">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="Varanasi Airport (VNS)" placeholder="Pickup Location" />
      </div>
      <button className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors shrink-0 mx-auto">
        <ArrowRightLeft className="w-4 h-4 text-zinc-500" />
      </button>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="Assi Ghat, Varanasi" placeholder="Drop Location" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="date" className="input-field pl-10" />
      </div>
      <div className="relative">
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <select className="input-field pr-8 appearance-none">
          <option>One Way</option>
          <option>Round Trip</option>
          <option>Hourly Rental</option>
        </select>
      </div>
    </div>
  );
}

function HotelForm() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-center">
      <div className="relative">
        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input className="input-field pl-10" defaultValue="Varanasi" placeholder="City, Area or Hotel Name" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="date" className="input-field pl-10" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input type="date" className="input-field pl-10" />
      </div>
      <div className="relative">
        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <select className="input-field pl-10 pr-8 appearance-none">
          <option>1 Room · 2 Adults</option>
          <option>2 Rooms · 4 Adults</option>
          <option>1 Room · 1 Adult</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── RESULT CARDS ────────────────────────────────────────────────────────────

function FlightCard({ f }: { f: typeof flightResults[0] }) {
  return (
    <div className={`result-card group bg-white dark:bg-[#111] border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 ${f.badge === 'cheapest' ? 'border-emerald-200 dark:border-emerald-700/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30'
        : f.badge === 'bestvalue' ? 'border-violet-200 dark:border-violet-700/40'
          : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
      }`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-2xl font-bold border border-zinc-100 dark:border-white/5">
            {f.logo}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-slate-800 dark:text-white">{f.airline}</p>
              <CompareBadge badge={f.badge} />
            </div>
            <p className="text-xs text-zinc-500">{f.code} · {f.class}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-1 justify-center">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800 dark:text-white">{f.dep}</p>
            <p className="text-xs font-bold text-zinc-500">{f.from}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-[100px]">
            <p className="text-xs text-zinc-400">{f.duration}</p>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
              <Plane className="w-3.5 h-3.5 text-orange-400" />
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">{f.stops}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800 dark:text-white">{f.arr}</p>
            <p className="text-xs font-bold text-zinc-500">{f.to}</p>
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1.5 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 border-zinc-100 dark:border-white/5 pt-4 md:pt-0">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {f.tags.map(t => (
              <span key={t} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30">{t}</span>
            ))}
            <span className="text-[10px] text-rose-500 font-semibold">{f.seats}</span>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{f.price}</p>
            <p className="text-xs text-zinc-400">per person</p>
            {f.priceDiff && <p className="text-[10px] text-zinc-400 mt-0.5">{f.priceDiff}</p>}
          </div>
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md shadow-orange-500/20 whitespace-nowrap">
            Book on {f.airline} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainCard({ t }: { t: typeof trainResults[0] }) {
  return (
    <div className={`result-card bg-white dark:bg-[#111] border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 ${t.badge === 'cheapest' ? 'border-emerald-200 dark:border-emerald-700/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30'
        : t.badge === 'fastest' ? 'border-amber-200 dark:border-amber-700/40'
          : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
      }`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Train className="w-4 h-4 text-blue-500" />
            <p className="font-bold text-slate-800 dark:text-white">{t.name}</p>
            <span className="text-xs text-zinc-400">#{t.number}</span>
            <CompareBadge badge={t.badge} />
          </div>
          <p className="text-xs text-zinc-500">{t.days}</p>
        </div>
        <div className="flex items-center gap-6 flex-1 justify-center">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800 dark:text-white">{t.dep}</p>
            <p className="text-xs font-bold text-zinc-500">{t.from}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-[100px]">
            <p className="text-xs text-zinc-400">{t.duration}</p>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
            </div>
            <p className="text-xs text-zinc-400">{t.class}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800 dark:text-white">{t.arr}</p>
            <p className="text-xs font-bold text-zinc-500">{t.to}</p>
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1.5 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 border-zinc-100 dark:border-white/5 pt-4 md:pt-0">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {t.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">{tag}</span>
            ))}
            <span className={`text-[10px] font-bold ${t.avail === 'Available' ? 'text-emerald-600' : 'text-amber-500'}`}>{t.avail}</span>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{t.price}</p>
            <p className="text-xs text-zinc-400">per person</p>
            {t.priceDiff && <p className="text-[10px] text-zinc-400 mt-0.5">{t.priceDiff}</p>}
          </div>
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md shadow-blue-500/20 whitespace-nowrap">
            Book Seat <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CabCard({ c }: { c: typeof cabResults[0] }) {
  return (
    <div className={`result-card bg-white dark:bg-[#111] border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 ${c.badge === 'cheapest' ? 'border-emerald-200 dark:border-emerald-700/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30'
        : c.badge === 'bestvalue' ? 'border-violet-200 dark:border-violet-700/40'
          : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
      }`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/5">
            <Car className="w-7 h-7 text-zinc-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-slate-800 dark:text-white">{c.type}</p>
              <CompareBadge badge={c.badge} />
            </div>
            <p className="text-sm text-zinc-500">{c.provider}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{c.rating}</span>
              <span className="text-xs text-zinc-400">({c.trips} trips)</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-wrap gap-2 justify-center">
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            <Users className="w-3 h-3" /> {c.pax}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">{c.category}</span>
          {c.features.map(f => (
            <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">{f}</span>
          ))}
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1.5 w-full md:w-auto justify-between border-t md:border-0 border-zinc-100 dark:border-white/5 pt-4 md:pt-0">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {c.tags.map(t => (
              <span key={t} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">{t}</span>
            ))}
            <p className="text-[10px] text-zinc-400">{c.eta}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800 dark:text-white">{c.price}</p>
            <p className="text-xs text-zinc-400">{c.perKm}</p>
          </div>
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md shadow-emerald-500/20 whitespace-nowrap">
            Book Cab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function HotelCard({ h }: { h: typeof hotelResults[0] }) {
  return (
    <div className={`result-card bg-white dark:bg-[#111] border rounded-2xl p-5 hover:shadow-xl transition-all duration-300 ${h.badge === 'cheapest' ? 'border-emerald-200 dark:border-emerald-700/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30'
        : h.badge === 'bestvalue' ? 'border-violet-200 dark:border-violet-700/40'
          : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10'
      }`}>
      <div className="flex flex-col md:flex-row gap-5">
        <div className="w-full md:w-28 h-28 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-5xl shrink-0 border border-zinc-100 dark:border-white/5">
          {h.image}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{h.name}</h3>
                <div className="flex">
                  {Array.from({ length: h.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <CompareBadge badge={h.badge} />
              </div>
              <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{h.area} · {h.distance}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  <ThumbsUp className="w-3 h-3" /> {h.rating}
                </div>
                <span className="text-xs text-zinc-400">{h.reviews.toLocaleString()} reviews</span>
                {h.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/30 font-semibold">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black text-slate-800 dark:text-white">{h.price}</p>
              <p className="text-xs text-zinc-400">{h.perNight} · taxes extra</p>
              <button className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md shadow-violet-500/20 w-full justify-center whitespace-nowrap">
                View Rooms <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {h.amenities.map(a => (
              <span key={a} className="text-xs px-2 py-1 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-white/5">{a}</span>
            ))}
            {h.refundable && (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Free Cancellation
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const tabConfig = [
  { id: 'flights', icon: Plane, label: 'Flights', color: 'text-orange-500', accent: 'from-orange-500 to-rose-500' },
  { id: 'trains', icon: Train, label: 'Trains', color: 'text-blue-500', accent: 'from-blue-500 to-indigo-500' },
  { id: 'cabs', icon: Car, label: 'Cabs', color: 'text-emerald-500', accent: 'from-emerald-500 to-teal-500' },
  { id: 'hotels', icon: Building2, label: 'Hotels', color: 'text-violet-500', accent: 'from-violet-500 to-purple-500' },
] as const;

const filtersByTab = { flights: flightFilters, trains: trainFilters, cabs: cabFilters, hotels: hotelFilters };

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('flights');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
  };

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  useLayoutEffect(() => {
    if (isSearching) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.result-card, .naviigo-deal',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out' }
      );
    }, listRef);
    return () => ctx.revert();
  }, [activeTab, isSearching]);

  const deal = naviigoDeals[activeTab];
  const tab = tabConfig.find(t => t.id === activeTab)!;

  const renderForm = () => {
    if (activeTab === 'flights') return <FlightForm />;
    if (activeTab === 'trains') return <TrainForm />;
    if (activeTab === 'cabs') return <CabForm />;
    return <HotelForm />;
  };

  const renderResults = () => {
    if (activeTab === 'flights') return flightResults.map((f, i) => <FlightCard key={i} f={f} />);
    if (activeTab === 'trains') return trainResults.map((t, i) => <TrainCard key={i} t={t} />);
    if (activeTab === 'cabs') return cabResults.map((c, i) => <CabCard key={i} c={c} />);
    return hotelResults.map((h, i) => <HotelCard key={i} h={h} />);
  };

  const sectionLabel = () => {
    if (activeTab === 'flights') return `${flightResults.length} flights found · DEL → VNS`;
    if (activeTab === 'trains') return `${trainResults.length} trains found · NDLS → BSB`;
    if (activeTab === 'cabs') return `${cabResults.length} cabs available`;
    return `${hotelResults.length} hotels in Varanasi`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] pt-24 pb-24 px-4 sm:px-6 md:px-10 font-sans">
      <style>{`
        .input-field {
          width: 100%;
          background: transparent;
          border: 2px solid;
          border-color: rgb(228 228 231);
          border-radius: 0.875rem;
          padding: 0.875rem 1rem;
          outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
          color: inherit;
        }
        .dark .input-field { border-color: rgb(39 39 42); }
        .input-field:focus { border-color: rgb(249 115 22); }
      `}</style>

      <div className="max-w-6xl mx-auto">

        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Book Your <span className={`bg-gradient-to-r ${tab.accent} bg-clip-text text-transparent`}>{tab.label}</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">Compare prices across <span className="font-semibold text-slate-700 dark:text-zinc-300">50+ travel platforms</span> · Apply NaviiGo coupons &amp; save more</p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111] rounded-[1.75rem] shadow-xl shadow-black/5 dark:shadow-black/20 border border-zinc-100 dark:border-white/5 p-6 sm:p-8 mb-8"
        >
          {/* Tab Bar */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-zinc-100/80 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 shadow-inner">
              {tabConfig.map(t => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id); setActiveFilters([]); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${isActive
                      ? `bg-white dark:bg-black shadow-md ${t.color} scale-105`
                      : 'text-zinc-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {renderForm()}
            </motion.div>
          </AnimatePresence>

          {/* Popular Routes */}
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Popular Routes</p>
            <div className="flex flex-wrap gap-2">
              {popularRoutes[activeTab].map(r => (
                <button key={r} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 border border-transparent hover:border-orange-200 dark:hover:border-orange-800/40 transition-all duration-150">
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Search Button + Filters */}
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleSearch}
              className={`flex items-center gap-2 bg-gradient-to-r ${tab.accent} text-white font-bold rounded-xl px-8 py-3.5 shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm shrink-0`}
            >
              <Search className="w-4 h-4" />
              Search {tab.label}
            </button>
            <FilterChips options={filtersByTab[activeTab]} active={activeFilters} onToggle={toggleFilter} />
          </div>
        </motion.div>

        {/* Results */}
        <div ref={listRef} className="space-y-4">
          {isSearching ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-32" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-20" />
                  </div>
                  <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                </div>
                <div className="flex justify-center gap-8">
                  <div className="h-8 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800 self-center animate-pulse" />
                  <div className="h-8 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" style={{ width: `${50 + i * 10}%` }} />
                      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-24" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-center text-xs text-zinc-400 animate-pulse pt-2">🔍 Searching 120+ sites for the best deals…</p>
            </div>
          ) : (
            <>
              {/* NaviiGo Deal Banner */}
              <div className="naviigo-deal sticky top-[4.5rem] z-30">
                <div className={`bg-gradient-to-r ${tab.accent} p-px rounded-2xl shadow-2xl`}>
                  <div className="bg-white dark:bg-[#0c0c0c] rounded-[calc(1rem-1px)] p-5 flex flex-col md:flex-row items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`bg-gradient-to-br ${tab.accent} rounded-xl p-3 shrink-0`}>
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{deal.label}</h3>
                          <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> {deal.tag}
                          </span>
                          <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Only 3 left
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {deal.provider} · Use code{' '}
                          <span className="font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 px-2 py-0.5 rounded-md tracking-widest">{deal.coupon}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            <CircleCheck className="w-3 h-3 text-emerald-500" /> Verified Fare
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            <Zap className="w-3 h-3 text-amber-500" /> Instant Booking
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            <ShieldCheck className="w-3 h-3 text-blue-500" /> Secure Payment
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-white/5 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-zinc-400 line-through text-sm">{deal.originalPrice}</span>
                          <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-black px-2 py-0.5 rounded-full">{deal.discount}</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{deal.price}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{deal.savings}</p>
                      </div>
                      <button className={`shrink-0 px-8 py-3 bg-gradient-to-r ${tab.accent} text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-sm`}>
                        Unlock Deal →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort Bar + Result Count */}
              <SortBar label={sectionLabel()} />

              {/* Cards */}
              {renderResults()}

              {/* Smart Insights */}
              <SmartInsights tab={activeTab} />

              {/* Load More */}
              <div className="pt-4 flex justify-center">
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-orange-400 hover:text-orange-500 dark:hover:border-orange-600 dark:hover:text-orange-400 font-semibold text-sm transition-all duration-200">
                  <BadgePercent className="w-4 h-4" /> Load more results
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
