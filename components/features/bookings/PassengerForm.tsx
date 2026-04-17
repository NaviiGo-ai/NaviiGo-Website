"use client";

import React from "react";
import { User, Calendar, Users, Briefcase } from "lucide-react";

interface Passenger {
  title: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
}

interface PassengerFormProps {
  count: number;
  passengers: Passenger[];
  onChange: (index: number, field: keyof Passenger, value: string) => void;
  gstEnabled: boolean;
  setGstEnabled: (val: boolean) => void;
  gstInfo: { gstin: string; companyName: string };
  onGstChange: (field: string, value: string) => void;
}

export default function PassengerForm({
  count,
  passengers,
  onChange,
  gstEnabled,
  setGstEnabled,
  gstInfo,
  onGstChange,
}: PassengerFormProps) {
  return (
    <div className="space-y-6">
      {/* Dynamic Passenger Sections */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-[10px] font-black text-emerald-500">{i + 1}</span>
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              {i === 0 ? "Lead Passenger" : `Passenger ${i + 1}`}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Title</label>
              <select
                value={passengers[i]?.title || "Mr"}
                onChange={(e) => onChange(i, "title", e.target.value)}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-3 text-sm focus:border-emerald-500/50 outline-none transition-colors appearance-none"
              >
                <option>Mr</option>
                <option>Ms</option>
                <option>Mrs</option>
                <option>Master</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">First Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul"
                value={passengers[i]?.firstName || ""}
                onChange={(e) => onChange(i, "firstName", e.target.value)}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-4 text-sm focus:border-emerald-500/50 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Sharma"
                value={passengers[i]?.lastName || ""}
                onChange={(e) => onChange(i, "lastName", e.target.value)}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-4 text-sm focus:border-emerald-500/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Age</label>
              <input
                type="number"
                placeholder="Years"
                value={passengers[i]?.age || ""}
                onChange={(e) => onChange(i, "age", e.target.value)}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-4 text-sm focus:border-emerald-500/50 outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Gender</label>
              <div className="flex bg-black border border-white/10 rounded-xl h-11 p-1">
                {["Male", "Female", "Other"].map((gen) => (
                  <button
                    key={gen}
                    onClick={() => onChange(i, "gender", gen)}
                    className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                      passengers[i]?.gender === gen
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {gen}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* GST Section */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Briefcase className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Business Booking</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Claim GST Input Tax Credit</p>
            </div>
          </div>
          <button 
            onClick={() => setGstEnabled(!gstEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${gstEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${gstEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {gstEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">GST Number (GSTIN)</label>
              <input
                type="text"
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={gstInfo.gstin}
                onChange={(e) => onGstChange("gstin", e.target.value.toUpperCase())}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-4 text-sm focus:border-emerald-500/50 outline-none transition-colors uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Company Name</label>
              <input
                type="text"
                placeholder="Registered Entity Name"
                value={gstInfo.companyName}
                onChange={(e) => onGstChange("companyName", e.target.value)}
                className="w-full h-11 bg-black border border-white/10 rounded-xl px-4 text-sm focus:border-emerald-500/50 outline-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
