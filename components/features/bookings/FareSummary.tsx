"use client";

import React from "react";
import { ShieldCheck, Info, Tag } from "lucide-react";

interface FareSummaryProps {
  basePrice: number;
  passengerCount: number;
  type: string;
}

export default function FareSummary({ basePrice, passengerCount, type }: FareSummaryProps) {
  const subtotal = basePrice * passengerCount;
  const taxes = Math.round(subtotal * 0.12); // 12% Tax
  const convenienceFee = 299; // Standard NaviiGo Fee
  const total = subtotal + taxes + convenienceFee;

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 sticky top-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center justify-between">
        Fare Summary
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Best Rate
        </span>
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-500 font-medium">Base Fare ({passengerCount} {passengerCount > 1 ? 'Passengers' : 'Passenger'})</span>
          <span className="text-zinc-300 font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-500 font-medium">Taxes & Surcharges</span>
          <span className="text-zinc-300 font-bold">₹{taxes.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-500 font-medium flex items-center gap-1.5">
            Convenience Fee <Info className="w-3 h-3 cursor-help" />
          </span>
          <span className="text-zinc-300 font-bold">₹{convenienceFee}</span>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Total Amount</p>
              <p className="text-3xl font-black text-white">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 justify-end">
                <Tag className="w-3 h-3" /> NAVIIFLY Applied
              </span>
              <p className="text-[9px] text-zinc-500 font-medium">Inclusive of all taxes</p>
            </div>
          </div>
        </div>

        {/* Professional Trust Badges */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3 text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              <span className="text-white font-bold block">Secure Payment Gateway</span>
              Your data is encrypted with AES-256 standards.
            </p>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              <span className="text-white font-bold block">NaviiGo Guarantee</span>
              Instant confirmation or 100% refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
