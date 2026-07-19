'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Plane, Train, TrendingUp } from 'lucide-react';

interface PlaceAutocompleteProps {
  name: string;
  placeholder?: string;
  defaultValue?: string;
  icon?: 'map' | 'plane' | 'train';
  className?: string;
}

// Popular cities shown on focus (before the user types anything)
const POPULAR_CITIES = [
  { name: 'New Delhi (DEL)', sub: 'National Capital' },
  { name: 'Mumbai (BOM)', sub: 'Financial Capital' },
  { name: 'Bangalore (BLR)', sub: 'Silicon Valley' },
  { name: 'Chennai (MAA)', sub: 'South India Gateway' },
  { name: 'Kolkata (CCU)', sub: 'City of Joy' },
  { name: 'Hyderabad (HYD)', sub: 'City of Pearls' },
  { name: 'Goa (GOI)', sub: 'Beach Capital' },
  { name: 'Jaipur (JAI)', sub: 'Pink City' },
  { name: 'Varanasi (VNS)', sub: 'Spiritual Capital' },
  { name: 'Kochi (COK)', sub: 'Queen of Arabian Sea' },
];

export default function PlaceAutocomplete({
  name,
  placeholder,
  defaultValue = '',
  icon = 'map',
  className = '',
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (input: string) => {
    if (input.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setShowPopular(false);
    try {
      const baseUrl = '';
      const res = await fetch(`${baseUrl}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setResults(data.predictions || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => search(query), 300);
    } else if (query.length === 0) {
      setResults([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPopular(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true);
    } else {
      // Show popular cities when field is empty and focused
      setShowPopular(true);
      setIsOpen(false);
    }
  };

  const handleSelect = (cityName: string) => {
    setQuery(cityName);
    setIsOpen(false);
    setShowPopular(false);
  };

  const IconComponent = {
    map: MapPin,
    plane: Plane,
    train: Train,
  }[icon];

  const showDropdown = isOpen && results.length > 0;
  const showPopularDropdown = showPopular && query.length < 2;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={query} />
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <IconComponent className="w-4 h-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
        </div>
        <input
          type="text"
          name={`${name}_display`}
          id={`autocomplete-${name}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              setIsOpen(true);
              setShowPopular(false);
            } else if (e.target.value.length === 0) {
              setShowPopular(true);
              setIsOpen(false);
            }
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl py-3.5 pl-11 pr-10 outline-none text-sm font-medium transition-all focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-orange-500/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute z-[999] left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {results.map((r: any, i: number) => (
                <button
                  key={r.place_id || i}
                  type="button"
                  onClick={() => handleSelect(r.description.split(',')[0].trim())}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all group/item"
                >
                  <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-lg group-hover/item:bg-orange-100 dark:group-hover/item:bg-orange-500/20 transition-colors">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {r.description}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-semibold uppercase tracking-wider">
                      {r.sub || 'India'}
                    </p>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Cities Dropdown (shown on focus when empty) */}
      <AnimatePresence>
        {showPopularDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute z-[999] left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Popular Cities</p>
            </div>
            <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleSelect(city.name)}
                  className="w-full flex items-center gap-3.5 px-3.5 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all group/item"
                >
                  <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-sm group-hover/item:bg-orange-100 dark:group-hover/item:bg-orange-500/30 transition-colors">
                    ✈️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {city.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-semibold uppercase tracking-wider">
                      {city.sub}
                    </p>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
