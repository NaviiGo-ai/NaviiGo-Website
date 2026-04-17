'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, Plus, Minus, Check } from 'lucide-react';

interface TravelersSelectorProps {
  value?: string;
  onSelect?: (val: string) => void;
}

export default function TravelersSelector({ value, onSelect }: TravelersSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('Economy');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const classes = ['Economy', 'Premium', 'Business', 'First'];

  const total = adults + children + infants;
  const displayValue = `${total} Traveler${total > 1 ? 's' : ''} · ${cabinClass}`;

  useEffect(() => {
    if (onSelect) {
      onSelect(total.toString());
    }
  }, [total, cabinClass, onSelect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Counter = ({ label, sub, count, setter, min = 0 }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div>
        <p className="text-sm font-bold text-zinc-900 dark:text-white">{label}</p>
        <p className="text-[10px] text-zinc-500 font-medium">{sub}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setter(Math.max(min, count - 1))}
          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
          disabled={count <= min}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-4 text-center text-sm font-bold text-zinc-900 dark:text-white">{count}</span>
        <button
          type="button"
          onClick={() => setter(count + 1)}
          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name="adults" value={adults} />
      <input type="hidden" name="children" value={children} />
      <input type="hidden" name="infants" value={infants} />
      <input type="hidden" name="class" value={cabinClass} />
      <div className="relative group">
        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl py-3.5 pl-11 pr-10 text-left text-sm font-medium hover:border-zinc-200 dark:hover:border-zinc-700 transition-all focus:border-orange-500 text-zinc-900 dark:text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {displayValue}
        </button>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute z-[110] right-0 mt-2 w-[300px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5"
          >
            <div className="space-y-1 mb-4">
              <Counter label="Adults" sub="12+ years" count={adults} setter={setAdults} min={1} />
              <Counter label="Children" sub="2-12 years" count={children} setter={setChildren} />
              <Counter label="Infants" sub="Under 2 years" count={infants} setter={setInfants} />
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Travel Class</p>
              <div className="grid grid-cols-2 gap-2">
                {classes.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCabinClass(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      cabinClass === c 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full mt-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
