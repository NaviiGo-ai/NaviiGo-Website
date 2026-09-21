'use client';

import React, { memo } from 'react';
import { Car, ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  c?: any;
  cab?: any;
  onBook?: (item: any) => void;
}

export const CabCard = memo(({ c, cab, onBook }: Props) => {
  const item = c || cab;
  if (!item) return null;

  if (item.type === 'cab_handoff') {
    const pickup = encodeURIComponent(item.from || '');
    const dropoff = encodeURIComponent(item.to || '');
    const uberLink = `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${pickup}&dropoff[formatted_address]=${dropoff}`;
    const olaLink = `https://www.olacabs.com/`;

    return (
      <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                <Car className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-lg text-naviigo-brown">
                    {item.from} → {item.to}
                  </h4>
                </div>
                {(item.distanceKm !== null && item.durationMinutes !== null) ? (
                  <p className="font-mono text-xs text-naviigo-brown/70 mt-1 uppercase tracking-wider">
                    ~{item.distanceKm} km · ~{Math.floor(item.durationMinutes / 60)} hr {item.durationMinutes % 60} min
                  </p>
                ) : (
                  <p className="font-mono text-xs text-naviigo-brown/70 mt-1 uppercase tracking-wider">
                    Route data unavailable
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 bg-paper-warm p-4 rounded-lg border border-[#EADFD4] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs font-bold text-naviigo-brown/60 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  Indicative cab cost
                </div>
                {item.estimatedFareMin !== null ? (
                  <div className="font-mono text-xl font-black text-naviigo-brown">
                    ₹{item.estimatedFareMin.toLocaleString('en-IN')} – ₹{item.estimatedFareMax.toLocaleString('en-IN')}
                  </div>
                ) : (
                  <div className="font-mono text-sm font-bold text-naviigo-brown">
                    Check live fare with provider
                  </div>
                )}
                {item.estimatedFareMin !== null && (
                  <div className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-paper-light border border-[#EADFD4] text-[10px] font-mono text-naviigo-brown/60 uppercase tracking-wider">
                    Naviigo Estimate
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <a
                  href={uberLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-black hover:bg-black/80 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-sm">⚫</span> Check Uber
                </a>
                <a
                  href={olaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-sm">🟢</span> Check Ola
                </a>
              </div>
            </div>
            
            <p className="text-[10px] font-sans text-naviigo-brown/50 mt-3 text-center sm:text-left">
              Actual fare and availability are confirmed by the ride provider. No live fare is claimed.
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
          <Car className="w-5 h-5 text-naviigo-brown" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-naviigo-brown group-hover:text-brand-primary transition-colors">{item.provider}</h4>
            <span className="font-mono text-xs text-naviigo-brown/60 uppercase">({item.type})</span>
          </div>
          <p className="font-mono text-xs text-naviigo-brown/70 mt-1">
            ETA: {item.eta || '15 mins'} {item.pax ? `· Capacity ${item.pax} Guests` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#EADFD4]">
        <div className="text-left md:text-right">
          <div className="font-mono text-lg font-bold text-naviigo-brown">{item.price}</div>
          {item.perKm && <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.perKm}</div>}
        </div>

        <div>
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

CabCard.displayName = 'CabCard';
export default CabCard;
