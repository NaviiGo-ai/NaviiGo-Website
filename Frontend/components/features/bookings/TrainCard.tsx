'use client';

import React, { memo } from 'react';
import { Train, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  t?: any;
  train?: any;
  onBook?: (item: any) => void;
}

export const TrainCard = memo(({ t, train, onBook }: Props) => {
  const item = t || train;
  if (!item) return null;

  if (item.type === 'rail_handoff') {
    // Basic date parsing for RailYatri (YYYY-MM-DD)
    // IRCTC doesn't support pre-filled URL parameters directly in a reliable way for anonymous users
    const ryLink = `https://www.railyatri.in/booking/trains-between-stations?from_code=${encodeURIComponent(item.from)}&from_name=${encodeURIComponent(item.from)}&to_code=${encodeURIComponent(item.to)}&to_name=${encodeURIComponent(item.to)}&journey_date=${item.date}&homequota=GN`;

    return (
      <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                <Train className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-lg text-naviigo-brown">
                    {item.from} → {item.to}
                  </h4>
                </div>
                <p className="font-mono text-xs text-naviigo-brown/70 mt-1 uppercase tracking-wider">
                  {item.date}
                </p>
              </div>
            </div>

            <div className="mt-4 bg-paper-warm p-4 rounded-lg border border-[#EADFD4] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs font-bold text-naviigo-brown/60 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  Live Availability
                </div>
                <div className="font-mono text-sm font-bold text-naviigo-brown">
                  Check live train schedules & fares
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-deep-sea-800 hover:bg-deep-sea-900 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-sm">🚆</span> Check IRCTC
                </a>
                <a
                  href={ryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-temple-red-600 hover:bg-temple-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-sm">🔴</span> Check RailYatri
                </a>
              </div>
            </div>
            
            <p className="text-[10px] font-sans text-naviigo-brown/50 mt-3 text-center sm:text-left">
              Live train schedules, classes and fares are confirmed by the rail provider.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-lg bg-paper-warm border border-[#EADFD4] text-naviigo-brown flex items-center justify-center shrink-0">
          <Train className="w-5 h-5 text-naviigo-brown" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-naviigo-brown group-hover:text-brand-primary transition-colors">{item.name}</h4>
            <span className="font-mono text-xs text-naviigo-brown/60">#{item.number}</span>
          </div>
          <p className="font-mono text-xs text-naviigo-brown/70 mt-1">
            {item.from} → {item.to} · {item.days || 'Daily Schedule'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#EADFD4]">
        <div className="text-left md:text-right">
          <div className="font-mono text-sm font-bold text-naviigo-brown">
            {item.dep} — {item.arr}
          </div>
          <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.duration} transit</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-naviigo-brown">{item.price}</div>
            {item.avail && <div className="font-mono text-[10px] text-naviigo-teal font-semibold uppercase">{item.avail}</div>}
          </div>
          {onBook ? (
            <button
              onClick={() => onBook(item)}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-sm"
            >
              Reserve <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : item.deepLink ? (
            <a
              href={item.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-sm"
            >
              Reserve <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
});

TrainCard.displayName = 'TrainCard';
export default TrainCard;
