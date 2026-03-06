'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Plane, Train, Car, Building2, MapPin, Calendar, Search, Tag, CheckCircle2, ArrowRightLeft, Star, Users } from 'lucide-react';

type TabType = 'flights' | 'trains' | 'cabs' | 'hotels';

const naviigoOffers = {
  flights: { label: 'NaviiGo Exclusive', provider: 'Air India / IndiGo', price: '₹4,150', originalPrice: '₹4,850', coupon: 'NAVIIFLY', tag: 'Cheapest Guaranteed' },
  trains: { label: 'NaviiGo Confirmed', provider: 'Vande Bharat / Rajdhani', price: '₹1,200', originalPrice: '₹1,450', coupon: 'NAVIITRAIN', tag: 'Zero Cancellation' },
  cabs: { label: 'NaviiGo Intercity', provider: 'Premium Sedan', price: '₹280', originalPrice: '₹350', coupon: 'NAVIICAB', tag: 'Lowest Fare' },
  hotels: { label: 'NaviiGo Stays', provider: 'Taj Nadesar Palace', price: '₹12,500', originalPrice: '₹18,500', coupon: 'NAVIIHOTEL', tag: 'Max Discount' },
};

const providersData = {
  flights: [
    { provider: 'MakeMyTrip', price: '₹4,850', type: 'Air India', route: 'DEL → VNS', time: '08:30 - 10:00' },
    { provider: 'ClearTrip', price: '₹4,920', type: 'IndiGo', route: 'DEL → VNS', time: '08:30 - 10:00' },
    { provider: 'Expedia', price: '₹5,100', type: 'Air India', route: 'DEL → VNS', time: '09:15 - 10:50' },
  ],
  trains: [
    { provider: 'IRCTC Official', price: '₹1,450', type: 'Vande Bharat Exp', route: 'NDLS → BSB', time: '06:00 - 14:00' },
    { provider: 'MakeMyTrip', price: '₹1,490', type: 'Vande Bharat Exp', route: 'NDLS → BSB', time: '06:00 - 14:00' },
    { provider: 'GoIbibo', price: '₹1,500', type: 'Shiv Ganga Exp', route: 'NDLS → BSBS', time: '20:05 - 06:10' },
  ],
  cabs: [
    { provider: 'Ola Cabs', price: '₹350', type: 'Prime Sedan', route: 'VNS Airport → Assi Ghat', time: '45 mins' },
    { provider: 'Uber', price: '₹380', type: 'UberGo', route: 'VNS Airport → Assi Ghat', time: '45 mins' },
    { provider: 'MakeMyTrip Cabs', price: '₹410', type: 'Sedan', route: 'VNS Airport → Assi Ghat', time: '45 mins' },
  ],
  hotels: [
    { provider: 'Agoda', price: '₹18,500', type: 'Taj Nadesar Palace', route: 'Varanasi Cantt', time: 'Check-in: 2 PM' },
    { provider: 'MakeMyTrip Hotels', price: '₹18,900', type: 'Taj Nadesar Palace', route: 'Varanasi Cantt', time: 'Check-in: 2 PM' },
    { provider: 'Booking.com', price: '₹19,200', type: 'BrijRama Palace', route: 'Darbhanga Ghat', time: 'Check-in: 1 PM' },
  ]
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('flights');
  const listRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  useLayoutEffect(() => {
    if (isSearching) return;
    let ctx = gsap.context(() => {
      gsap.fromTo(".booking-row, .locked-header",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }
      );
    }, listRef);
    return () => ctx.revert();
  }, [activeTab, isSearching]);

  const renderInputs = () => {
    switch(activeTab) {
      case 'flights':
        return (
          <>
            <div className="flex-[2] relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="From (City or Airport)" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="New Delhi (DEL)" />
            </div>
            <div className="flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
               <ArrowRightLeft className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex-[2] relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="To (City or Airport)" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="Varanasi (VNS)" />
            </div>
            <div className="flex-[1.5] relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="date" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" />
            </div>
          </>
        );
      case 'trains':
        return (
          <>
            <div className="flex-[2] relative">
              <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="From Station" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="New Delhi (NDLS)" />
            </div>
            <div className="flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
               <ArrowRightLeft className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex-[2] relative">
              <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="To Station" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="Varanasi (BSB)" />
            </div>
            <div className="flex-[1.5] relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="date" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" />
            </div>
          </>
        );
      case 'cabs':
        return (
          <>
            <div className="flex-[2] relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Pickup Location" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="Varanasi Airport" />
            </div>
            <div className="flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0">
               <ArrowRightLeft className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex-[2] relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Drop Location" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="Assi Ghat" />
            </div>
          </>
        );
      case 'hotels':
        return (
          <>
            <div className="flex-[2.5] relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="City, Area, Landmark, or Hotel Name" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="Taj Nadesar Palace, Varanasi" />
            </div>
            <div className="flex-[1.5] relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Check In - Check Out" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="12 Aug - 14 Aug" />
            </div>
            <div className="flex-[1] relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Guests" className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 transition-colors" defaultValue="2 Adults, 1 Room" />
            </div>
          </>
        );
    }
  };

  const naviigoCurrent = naviigoOffers[activeTab];
  const listData = providersData[activeTab];

  return (
    <div className="min-h-screen relative bg-zinc-50 dark:bg-[#050505] pt-28 pb-24 px-4 sm:px-6 md:px-12 font-sans">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Search Header (MMT Style) */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white dark:bg-[#111] rounded-[2rem] p-6 sm:p-10 mb-12 shadow-xl shadow-black/5 dark:shadow-black/20 border border-zinc-100 dark:border-white/5"
        >
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl shadow-inner gap-1">
              {[
                { id: 'flights', icon: Plane, label: 'Flights' },
                { id: 'trains', icon: Train, label: 'Trains' },
                { id: 'cabs', icon: Car, label: 'Cabs' },
                { id: 'hotels', icon: Building2, label: 'Hotels' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={
                      'flex items-center gap-2 px-6 py-3 rounded-xl capitalize font-semibold transition-all duration-300 ' + 
                      (isActive 
                        ? 'bg-white text-orange-600 dark:bg-black dark:text-orange-500 shadow-md transform scale-105' 
                        : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5')
                    }
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs Row */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-[#111]">
            {renderInputs()}
            
            <button 
              onClick={handleSearch}
              className="w-full lg:w-auto h-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl px-10 py-4 hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search className="w-5 h-5" />
              SEARCH
            </button>
          </div>
        </motion.div>

        {/* Results Area */}
        <div ref={listRef} className="space-y-6">
          {!isSearching && (
            <>
              {/* Locked NaviiGo Top Row */}
              <div className="locked-header sticky top-24 z-30 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-2 border-orange-500 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl shadow-orange-500/10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="bg-orange-500 text-white rounded-full p-3 flex shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white">{naviigoCurrent.label}</h3>
                      <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> {naviigoCurrent.tag}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {naviigoCurrent.provider} • Auto-applied <span className="text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-md bg-white dark:bg-black/50 ml-1">{naviigoCurrent.coupon}</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-orange-200 dark:border-orange-900/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 line-through text-lg font-medium">{naviigoCurrent.originalPrice}</span>
                    <p className="text-4xl font-black text-orange-600 dark:text-orange-500">{naviigoCurrent.price}</p>
                  </div>
                  <button className="w-full md:w-auto px-10 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl mt-3 font-bold shadow-lg shadow-orange-600/30 transition-all transform hover:scale-105 active:scale-95 text-lg">
                    Book Now
                  </button>
                </div>
              </div>

              {/* Competitors List */}
              <div className="pt-4 px-2 flex items-center gap-2 text-zinc-500 uppercase text-xs font-bold tracking-widest">
                <Tag className="w-4 h-4" /> Compare Other Sites
              </div>

              {listData.map((item, i) => (
                <div key={i} className="booking-row bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300">
                   <div>
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-3">
                       {item.provider} 
                       <span className="text-xs font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 tracking-wide uppercase">
                         {item.type}
                       </span>
                     </h3>
                     <p className="text-zinc-500 dark:text-zinc-400 mt-1">{item.route} • {item.time}</p>
                   </div>
                   <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-white/5">
                     <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{item.price}</p>
                     <button className="px-6 py-2 bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-white rounded-lg md:mt-2 font-semibold hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors">
                       View Deal
                     </button>
                   </div>
                </div>
              ))}
            </>
          )}

          {isSearching && (
             <div className="py-20 flex flex-col items-center justify-center opacity-60">
                 <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                 <p className="text-lg font-medium text-zinc-500 animate-pulse">Scraping the web for cheapest fares...</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
