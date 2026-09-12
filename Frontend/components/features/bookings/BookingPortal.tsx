"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, ExternalLink, Shield, Plane, Train, Hotel, Car, Info } from "lucide-react";

interface BookingPortalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: any;
  bookingType: "flights" | "hotels" | "trains" | "cabs";
  travelersCount: number;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flights: <Plane className="w-5 h-5" />,
  hotels: <Hotel className="w-5 h-5" />,
  trains: <Train className="w-5 h-5" />,
  cabs: <Car className="w-5 h-5" />,
};

// ── OTA Provider Configs ────────────────────────────────────
interface OTAOption {
  name: string;
  tag?: string;
  logo: string;
  color: string;
  buildUrl: (item: any) => string;
  priceMultiplier: number; // relative to base price
}

// Date helper for OTA deep links
function getOTADates(item: any) {
  // If no date provided in item, default to 7 days from now
  let dStr = item._date;
  if (!dStr) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    dStr = d.toISOString().split('T')[0];
  }
  const [y, m, d] = dStr.split('-');
  return {
    ymd: `${y}-${m}-${d}`,      // YYYY-MM-DD (Google)
    dmy: `${d}/${m}/${y}`,      // DD/MM/YYYY (Cleartrip, Yatra)
    yymmdd: `${y.slice(2)}${m}${d}` // YYMMDD (Skyscanner)
  };
}

const FLIGHT_OTAS: OTAOption[] = [
  {
    name: 'Skyscanner',
    tag: 'Compare',
    logo: '🔍',
    color: 'bg-deep-sea-500',
    priceMultiplier: 1.0,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      return `https://www.skyscanner.co.in/transport/flights/${item.from?.toLowerCase() || 'del'}/${item.to?.toLowerCase() || 'bom'}/${dates.yymmdd}`;
    },
  },
  {
    name: 'Cleartrip',
    logo: '🟢',
    color: 'bg-jungle-green-600',
    priceMultiplier: 1.02,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      return `https://www.cleartrip.com/flights/results?from=${item.from}&to=${item.to}&adults=1&childs=0&infants=0&class=Economy&depart_date=${dates.dmy}&intl=n`;
    },
  },
  {
    name: 'Yatra',
    logo: '🔴',
    color: 'bg-temple-red-600',
    priceMultiplier: 1.04,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      // Yatra 404s if format is wrong, DD/MM/YYYY is required
      return `https://flight.yatra.com/air-search-ui/dom2/trigger?type=O&viewName=normal&flexi=0&noOfSegments=1&origin=${item.from}&originCountry=IN&destination=${item.to}&destinationCountry=IN&flight_depart_date=${dates.dmy}&ADT=1&CHD=0&INF=0&class=Economy`;
    },
  },
  {
    name: 'MakeMyTrip',
    logo: '🔵',
    color: 'bg-deep-sea-600',
    priceMultiplier: 1.05,
    buildUrl: (item) => {
       const dates = getOTADates(item);
       return `https://www.makemytrip.com/flight/search?itinerary=${item.from}-${item.to}-${dates.dmy}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`;
    },
  },
  {
    name: 'Google Flights',
    logo: '🌐',
    color: 'bg-muted-600',
    priceMultiplier: 1.0,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      return `https://www.google.com/travel/flights?q=flights+from+${item.from}+to+${item.to}+on+${dates.ymd}&curr=INR`;
    },
  },
];

const HOTEL_OTAS: OTAOption[] = [
  {
    name: 'Booking.com',
    tag: 'Direct',
    logo: '🅱️',
    color: 'bg-deep-sea-700',
    priceMultiplier: 1.0,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      const city = encodeURIComponent(item.area || item.to || item.name || 'India');
      const [y, m, d] = dates.ymd.split('-');
      const co = new Date(Number(y), Number(m) - 1, Number(d) + 1);
      const checkout = `${co.getFullYear()}-${String(co.getMonth() + 1).padStart(2, '0')}-${String(co.getDate()).padStart(2, '0')}`;
      return `https://www.booking.com/searchresults.html?ss=${city}&checkin=${dates.ymd}&checkout=${checkout}&group_adults=${item._travelers || 1}&no_rooms=1&selected_currency=INR`;
    },
  },
  {
    name: 'Hotellook',
    tag: 'TravelPayouts',
    logo: '🏨',
    color: 'bg-deep-sea-600',
    priceMultiplier: 0.98,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      const city = encodeURIComponent(item.area || item.to || item.name || 'India');
      const [y, m, d] = dates.ymd.split('-');
      const co = new Date(Number(y), Number(m) - 1, Number(d) + 1);
      const checkout = `${co.getFullYear()}-${String(co.getMonth() + 1).padStart(2, '0')}-${String(co.getDate()).padStart(2, '0')}`;
      return `https://search.hotellook.com/hotels?destination=${city}&checkIn=${dates.ymd}&checkOut=${checkout}&adults=${item._travelers || 1}&currency=INR&language=en`;
    },
  },
  {
    name: 'Google Hotels',
    logo: '🌐',
    color: 'bg-deep-sea-500',
    priceMultiplier: 1.0,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      const city = encodeURIComponent(item.area || item.to || item.name || 'India');
      const [y, m, d] = dates.ymd.split('-');
      const co = new Date(Number(y), Number(m) - 1, Number(d) + 1);
      const checkout = `${co.getFullYear()}-${String(co.getMonth() + 1).padStart(2, '0')}-${String(co.getDate()).padStart(2, '0')}`;
      return `https://www.google.com/travel/hotels?q=hotels+in+${city}&dates=${dates.ymd},${checkout}&guests=${item._travelers || 1}&currency=INR`;
    },
  },
  {
    name: 'Goibibo',
    logo: '🟠',
    color: 'bg-saffron-600',
    priceMultiplier: 0.97,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      const city = encodeURIComponent(item.area || item.to || '');
      const [y, m, d] = dates.ymd.split('-');
      const co = new Date(Number(y), Number(m) - 1, Number(d) + 1);
      const checkout = `${co.getFullYear()}-${String(co.getMonth() + 1).padStart(2, '0')}-${String(co.getDate()).padStart(2, '0')}`;
      return `https://www.goibibo.com/hotels/search/?city=${city}&checkin=${dates.ymd}&checkout=${checkout}&adults=${item._travelers || 1}&children=0&rooms=1`;
    },
  },
];

const TRAIN_OTAS: OTAOption[] = [
  {
    name: 'IRCTC',
    tag: 'Official',
    logo: '🚆',
    color: 'bg-deep-sea-800',
    priceMultiplier: 1.0,
    buildUrl: () => `https://www.irctc.co.in/nget/train-search`,
  },
  {
    name: 'RailYatri',
    tag: 'Pre-filled',
    logo: '🔴',
    color: 'bg-temple-red-600',
    priceMultiplier: 1.0,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      // Exact RailYatri format: trains-between-stations with from_code, to_code, from_name, to_name
      const fromCode = encodeURIComponent(item.from || 'NDLS');
      const toCode = encodeURIComponent(item.to || 'BSB');
      const fromName = encodeURIComponent(item.fromName || item.from || 'NEW DELHI');
      const toName = encodeURIComponent(item.toName || item.to || 'VARANASI');
      return `https://www.railyatri.in/booking/trains-between-stations?from_code=${fromCode}&from_name=${fromName}&to_code=${toCode}&to_name=${toName}&journey_date=${dates.ymd}&homequota=GN`;
    },
  },
  {
    name: '12Go',
    tag: 'TravelPayouts',
    logo: '🌏',
    color: 'bg-green-700',
    priceMultiplier: 1.05,
    buildUrl: (item) => {
      const dates = getOTADates(item);
      const fromCity = encodeURIComponent(item.fromName || item.from || 'Delhi');
      const toCity = encodeURIComponent(item.toName || item.to || 'Varanasi');
      return `https://12go.co/en/travel/india/${fromCity.toLowerCase()}/india/${toCity.toLowerCase()}?date=${dates.ymd}&people=1&transport=train`;
    },
  },
];

const CAB_OTAS: OTAOption[] = [
  {
    name: 'Uber',
    tag: 'Pre-filled',
    logo: '⚫',
    color: 'bg-black',
    priceMultiplier: 1.08,
    // Uber documented deep link API — uses formatted_address to pre-fill locations
    buildUrl: (item) => {
      const pickup = encodeURIComponent(item.from || '');
      const dropoff = encodeURIComponent(item.to || '');
      return `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickup}&dropoff[formatted_address]=${dropoff}`;
    },
  },
  {
    name: 'Ola',
    logo: '🟢',
    color: 'bg-green-600',
    priceMultiplier: 1.0,
    // Ola web does not support URL-based prefilling
    buildUrl: () => `https://www.olacabs.com/`,
  },
  {
    name: 'InDrive',
    logo: '🟣',
    color: 'bg-indigo-600',
    priceMultiplier: 0.95,
    buildUrl: () => `https://indrive.com/en/city-ride/`,
  },
];

const OTA_MAP: Record<string, OTAOption[]> = {
  flights: FLIGHT_OTAS,
  hotels: HOTEL_OTAS,
  trains: TRAIN_OTAS,
  cabs: CAB_OTAS,
};

function formatPrice(num: number): string {
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export default function BookingPortal({
  isOpen,
  onClose,
  selectedItem,
  bookingType,
  travelersCount,
}: BookingPortalProps) {
  if (!isOpen || !selectedItem) return null;

  const otas = OTA_MAP[bookingType] || FLIGHT_OTAS;
  const basePrice = selectedItem.priceNum || 5000;

  // Sort by price (cheapest first)
  const options = otas
    .map((ota) => ({
      ...ota,
      finalPrice: Math.round(basePrice * ota.priceMultiplier * travelersCount),
      url: ota.buildUrl(selectedItem),
    }))
    .sort((a, b) => a.finalPrice - b.finalPrice);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0e] border border-muted-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-muted-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-muted-200 dark:border-white/10 ${
              bookingType === 'flights' ? 'bg-saffron-50 dark:bg-saffron-500/10 text-saffron-600' :
              bookingType === 'hotels' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' :
              bookingType === 'trains' ? 'bg-deep-sea-50 dark:bg-deep-sea-500/10 text-deep-sea-600' :
              'bg-green-50 dark:bg-green-500/10 text-green-600'
            }`}>
              {TYPE_ICONS[bookingType]}
            </div>
            <div>
              <h2 className="text-lg font-black text-muted-900 dark:text-white">
                {selectedItem.airline || selectedItem.provider || selectedItem.name}
                {selectedItem.code && <span className="text-muted-400 font-normal text-sm ml-2">{selectedItem.code}</span>}
              </h2>
              <p className="text-xs text-muted-500 flex items-center gap-2">
                {selectedItem.from && selectedItem.to ? (
                  <>{selectedItem.from} → {selectedItem.to}</>
                ) : selectedItem.area ? (
                  <>{selectedItem.area}</>
                ) : null}
                {selectedItem.duration && <> · {selectedItem.duration}</>}
                {selectedItem.stops && <> · {selectedItem.stops}</>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-muted-100 dark:hover:bg-white/5 flex items-center justify-center text-muted-400 hover:text-muted-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Booking Options ───────────────────────────────── */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-muted-900 dark:text-white">Booking options</h3>
            <button className="text-muted-400 hover:text-muted-600">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-400 mb-4">
            How options are ranked · Prices for {travelersCount} {travelersCount > 1 ? 'travelers' : 'traveler'}
          </p>
        </div>

        <div className="px-6 pb-4">
          <div className="border border-muted-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-muted-100 dark:divide-white/5">
            {options.map((ota, i) => (
              <button
                key={ota.name}
                onClick={() => window.open(ota.url, '_blank', 'noopener,noreferrer')}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted-50 dark:hover:bg-white/[0.02] transition-colors group text-left"
              >
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg bg-muted-100 dark:bg-white/5 flex items-center justify-center text-lg shrink-0 border border-muted-200 dark:border-white/10 group-hover:border-muted-300 dark:group-hover:border-white/20 transition-colors">
                  {ota.logo}
                </div>

                {/* Name + Tag */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-900 dark:text-white">
                      Book with {ota.name}
                    </span>
                    {ota.tag && (
                      <span className="text-[10px] font-medium text-muted-400 bg-muted-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-muted-200 dark:border-white/10">
                        {ota.tag}
                      </span>
                    )}
                    {i === 0 && (
                      <span className="text-[10px] font-bold text-jungle-green-600 dark:text-jungle-green-400 bg-jungle-green-50 dark:bg-jungle-green-500/10 px-2 py-0.5 rounded-full">
                        Best price
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0 flex items-center gap-4">
                  <span className={`text-sm font-bold ${i === 0 ? 'text-jungle-green-600 dark:text-jungle-green-400' : 'text-muted-700 dark:text-muted-300'}`}>
                    {formatPrice(ota.finalPrice)}
                  </span>
                  <span className="text-xs font-semibold text-deep-sea-600 dark:text-deep-sea-400 bg-deep-sea-50 dark:bg-deep-sea-500/10 px-4 py-2 rounded-full border border-deep-sea-200 dark:border-deep-sea-500/20 group-hover:bg-deep-sea-100 dark:group-hover:bg-deep-sea-500/20 transition-colors whitespace-nowrap">
                    Continue
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-6 pb-5 space-y-3">
          <p className="text-[11px] text-center text-muted-400">
            Prices include required taxes + fees for {travelersCount} adult{travelersCount > 1 ? 's' : ''}. Optional charges and <span className="underline cursor-pointer hover:text-muted-600">bag fees</span> may apply.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-400">
            <Shield className="w-3 h-3 text-jungle-green-500" />
            <span>NaviiGo aggregates prices · You book directly with the provider</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
