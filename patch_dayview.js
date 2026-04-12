const fs = require('fs');
const file = 'C:/Users/sehaj/Downloads/NaviiGo Web/NaviiGo-Website/app/itinerary/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFn = `function DayViewPage({ form, onBack }: { form: Record<string, unknown>; onBack: () => void }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const destId = form.destination as string, destName = form.destName as string;
  const data = DEST_DATA[destId] ?? FALLBACK_DEST;
  const [activeDay, setActiveDay] = useState(0);
  const [activeActivity, setActiveActivity] = useState(-1);
  const [dayRouteInfo, setDayRouteInfo] = useState<{ distance: string, time: string } | null>(null);
  const [customPlans, setCustomPlans] = useState<DayPlan[]>(() => (form.customPlans as DayPlan[]) || JSON.parse(JSON.stringify(data.dayPlans)));
  const plan: DayPlan = customPlans[activeDay] ?? customPlans[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(searchQuery)}&format=json&limit=5\`);
      const results = await res.json();
      setSearchRes(results);
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  const addCustomActivity = (place: any) => {
    setCustomPlans(prev => {
      const copy = [...prev];
      const newAct = {
        name: place.name || place.display_name.split(',')[0],
        desc: place.display_name,
        time: 'Custom Time',
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        crowd: 'Low' as CrowdLevel,
        crowdTip: 'Custom added location',
        slot: 'Afternoon' as any,
        tags: ['Custom']
      };
      copy[activeDay] = { ...copy[activeDay], activities: [...copy[activeDay].activities, newAct] };
      return copy;
    });
    setSearchQuery('');
    setSearchRes([]);
    setIsSaved(false);
  };

  const moveActivity = (fromIdx: number, toIdx: number) => {
    setCustomPlans(prev => {
      const copy = [...prev];
      const acts = [...copy[activeDay].activities];
      const [moved] = acts.splice(fromIdx, 1);
      acts.splice(toIdx, 0, moved);
      copy[activeDay] = { ...copy[activeDay], activities: acts };
      return copy;
    });
    setIsSaved(false);
  };

  const removeActivity = (idx: number) => {
    setCustomPlans(prev => {
      const copy = [...prev];
      const acts = [...copy[activeDay].activities];
      acts.splice(idx, 1);
      copy[activeDay] = { ...copy[activeDay], activities: acts };
      return copy;
    });
    setIsSaved(false);
  };

  const slotEmoji: Record<string, string> = { Morning: '🌅', Afternoon: '☀️', Evening: '🌙' };

  // Map pins from current day's activities
  const mapPins = useMemo(() => plan.activities.map((a, i) => ({
    lat: a.lat, lng: a.lng, label: a.name, number: i + 1,
  })), [plan]);

  // Calculate day total hours
  let totalHours = 0;
  plan.activities.forEach(a => {
    const parts = a.time.split('–').map(s => s.trim());
    if (parts.length === 2 && parts[0].includes(':') && parts[1].includes(':')) {
      const parse = (s: string) => {
        const m = s.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
        if (!m) return null;
        let h = parseInt(m[1]);
        if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h + parseInt(m[2]) / 60;
      };
      const s = parse(parts[0]), e = parse(parts[1]);
      if (s !== null && e !== null) { let d = e - s; if (d < 0) d += 24; totalHours += d; }
    } else totalHours += 2.5; 
    if (a.travelFromPrev) totalHours += 0.5; 
  });

  const isExhausting = totalHours > 10 || plan.activities.length > 5;
  const isRaining = plan.weather.rain > 20;

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
      {/* Top bar */}
      <div className="sticky top-20 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-600 dark:text-zinc-300">←</button>
        <div className="flex-1">
          <h1 className="font-bold text-zinc-900 dark:text-white text-sm">{destName} — Day-by-Day Itinerary</h1>
          <p className="text-xs text-zinc-400 hidden sm:block">Full plan with crowd & weather alerts</p>
        </div>

        {/* Nav Links */}
        <button onClick={() => window.open(\`/itinerary/packing?dest=\${destId}\`, '_blank')} className="hidden md:flex px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🧳 Pack</button>
        <button onClick={() => window.open(\`/itinerary/expenses?budget=\${form.budget || 15000}&days=\${form.days || 3}\`, '_blank')} className="hidden md:flex px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">💰 Track Exp.</button>

        <button onClick={() => { saveItinerary(destId, destName, { ...form, customPlans }); setIsSaved(true); }} disabled={isSaved}
          className={\`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors \${isSaved ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}\`}>
          {isSaved ? '✓ Saved' : '💾 Save'}
        </button>
      </div>

      {/* Day tabs */}
      <div className="sticky top-[120px] z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {data.dayPlans.map((dp, i) => (
            <button key={dp.day} onClick={() => { setActiveDay(i); setActiveActivity(-1); }}
              className={\`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                \${activeDay === i ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}\`}>
              Day {dp.day}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* DAY DASHBOARD */}
            <div className="mb-8">
              {/* Header Title */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">Day {plan.day}: {plan.title}</h2>
                <button onClick={() => {
                  const baseDate = form.startDate ? new Date(form.startDate as string) : new Date();
                  baseDate.setDate(baseDate.getDate() + activeDay);
                  let ics = "BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//NaviiGo//Itinerary//EN\\n";
                  plan.activities.forEach((a) => {
                    const parts = a.time.split('–').map(s => s.trim());
                    let sh = 9, sm = 0, eh = 10, em = 0;
                    if (parts.length === 2) {
                      const parse = (s: string) => { const m = s.match(/(\\d+):(\\d+)\\s*(AM|PM)/i); if (!m) return null; let h = parseInt(m[1]); if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12; if (m[3].toUpperCase() === 'AM' && h === 12) h = 0; return [h, parseInt(m[2])]; };
                      const s = parse(parts[0]), e = parse(parts[1]);
                      if (s) { sh = s[0]; sm = s[1]; }
                      if (e) { eh = e[0]; em = e[1]; }
                    }
                    const sd = new Date(baseDate); sd.setHours(sh, sm, 0);
                    const ed = new Date(baseDate); ed.setHours(eh, em, 0);
                    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    ics += \`BEGIN:VEVENT\\nSUMMARY:\${a.name}\\nDESCRIPTION:\${a.desc}\\nDTSTART:\${fmt(sd)}\\nDTEND:\${fmt(ed)}\\nLOCATION:\${a.lat},\${a.lng}\\nEND:VEVENT\\n\`;
                  });
                  ics += "END:VCALENDAR";
                  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
                  const a = document.createElement('a'); a.href = url; a.download = \`NaviiGo_Day\${plan.day}.ics\`; a.click();
                }} className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-full font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 shrink-0">
                  <span>📅</span> Add to Calendar
                </button>
              </div>

              {/* Top Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Weather */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-4xl">{plan.weather.emoji}</span>
                  <div>
                    <div className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">{plan.weather.temp}</div>
                    <div className="text-xs text-zinc-500">{plan.weather.condition}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                      <span className="text-[10px]">💡</span> {plan.weather.tip}
                    </div>
                  </div>
                </div>

                {/* Daily Budget Progress */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"><span>💳</span> Daily Budget Use</h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      ₹{(form.budget as number / (form.days as number || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cap
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: \`\${Math.min(100, (plan.activities.length * 20)) }%\` }} transition={{ duration: 1 }} className={\`h-full \${plan.activities.length > 4 ? 'bg-amber-400' : 'bg-emerald-500'}\`} />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-2 text-right">{plan.activities.length} activities planned</div>
                </div>

                {/* Crowd Context */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5"><span>👥</span> Crowd Level</h4>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as CrowdLevel[]).map(level => {
                      const count = plan.activities.filter(a => a.crowd === level).length;
                      if (count === 0) return null;
                      return (
                        <div key={level} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-1.5 text-center">
                          <CrowdDot level={level} />
                          <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{count} {level}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Route Info */}
                {dayRouteInfo ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xl">🗺️</span><span className="font-bold text-xs text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">Total Commute</span></div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-400 text-lg leading-tight">{dayRouteInfo.time}</div>
                    <div className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70 font-medium">{dayRouteInfo.distance} driving distance</div>
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center opacity-70">
                    <div className="text-base mb-1">📍</div>
                    <div className="text-[10px] font-medium text-zinc-500">Route calculating...</div>
                  </div>
                )}
              </div>

              {/* Actionable Alerts Row */}
              {(isRaining || isExhausting || plan.activities.length > 5) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isRaining && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex gap-3 shadow-sm items-center">
                      <div className="text-3xl">🌧️</div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-0.5">Rain Expected</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{plan.weather.rain}% chance of rain today. Keep an umbrella handy!</p>
                      </div>
                    </div>
                  )}

                  {isExhausting && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex gap-3 shadow-sm items-center">
                      <div className="text-3xl">⚠️</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-400 mb-0.5">Overstuffed Schedule</h4>
                        <p className="text-[11px] text-red-700 dark:text-red-300 leading-tight">This day involves ~{Math.round(totalHours)} hours of activity. Consider removing an item to avoid exhaustion.</p>
                      </div>
                      <button onClick={() => removeActivity(plan.activities.length - 1)} className="shrink-0 text-[10px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                        Drop Last
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2-col: Activities + Map */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Timeline & Additions */}
              <div className="flex-1 space-y-0">
                {/* Timeline Actions */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button onClick={(e) => { e.stopPropagation(); alert('✨ AI is optimizing your route to minimize travel time...'); }}
                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 transition-all px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95">
                    <span>✨</span> Optimize Day
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); alert('😌 Making schedule more relaxed by removing less important activities...'); }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95">
                    <span>😌</span> Make it Relaxed
                  </button>
                </div>

                {/* Timeline */}
                <div className="relative border-l-2 border-zinc-100 dark:border-zinc-800/50 pl-6 ml-4 space-y-6">
                  {plan.activities.map((act, i) => {
                    const isLast = i === plan.activities.length - 1;
                    const slotChanged = i === 0 || plan.activities[i - 1].slot !== act.slot;
                    const isActive = activeActivity === i;

                    return (
                      <div key={act.name + i} className="relative">
                        {/* Slot Header */}
                        {slotChanged && (
                          <div className="absolute -left-[35px] top-0 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#f7f8fc] dark:bg-[#0a0a0f] border-2 border-zinc-300 dark:border-zinc-600" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#f7f8fc] dark:bg-[#0a0a0f] px-1 translate-y-[-2px]">{act.slot} {slotEmoji[act.slot]}</span>
                          </div>
                        )}
                        
                        {/* Active Indicator & Connection line */}
                        <div className={\`absolute -left-[33px] top-6 w-3 h-3 rounded-full transition-all \${isActive ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]' : 'bg-zinc-200 dark:bg-zinc-700'}\`} />

                        {act.travelFromPrev && (
                          <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mb-3 shadow-sm transform -translate-y-2">
                            🚘 {act.travelFromPrev} drive
                          </div>
                        )}

                        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} 
                          className={\`bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group/act relative overflow-hidden border \${isActive ? 'border-emerald-300 shadow-emerald-500/5' : 'border-zinc-100 dark:border-zinc-800'}\`}
                          onClick={() => setActiveActivity(isActive ? -1 : i)}>
                          
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 pr-3">
                              <div className="text-[11px] font-bold text-zinc-500 font-mono mb-1">{act.time}</div>
                              <h4 className="font-bold text-zinc-900 dark:text-white text-[15px]">{act.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Manage Buttons */}
                              <div className="opacity-0 group-hover/act:opacity-100 transition-opacity flex bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 overflow-hidden">
                                <button onClick={(e) => { e.stopPropagation(); moveActivity(i, Math.max(0, i - 1)); }} disabled={i === 0} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent">↑</button>
                                <button onClick={(e) => { e.stopPropagation(); moveActivity(i, Math.min(plan.activities.length - 1, i + 1)); }} disabled={isLast} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 border-l border-white dark:border-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent">↓</button>
                                <button onClick={(e) => { e.stopPropagation(); removeActivity(i); }} className="w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border-l border-white dark:border-zinc-900">✕</button>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed pr-2">{act.desc}</p>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                            <div className="flex gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md px-2 py-1 font-medium">
                                <span>💡</span> {act.crowdTip}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2 py-1 border border-zinc-100 dark:border-zinc-700/50 shadow-sm">
                                <span>💳</span> ₹{act.priceBase || [250, 400, 800, 1500][i % 4]}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(\`/itinerary/detail?type=attraction&dest=\${destId}&name=\${encodeURIComponent(act.name)}\`); }}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors shrink-0">
                              View details &rarr;
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                {/* Search & Add Location */}
                <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2"><span>➕</span> Add a Custom Spot</h4>
                  <p className="text-xs text-zinc-500 mb-3">Found a nice cafe or local spot? Add it to your day.</p>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cafes, malls, attractions..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner" />
                    <button type="submit" disabled={isSearching} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                      {isSearching ? '...' : 'Search'}
                    </button>
                  </form>
                  {searchRes.length > 0 && (
                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      {searchRes.map(res => (
                        <div key={res.place_id} className="py-2.5 px-3 flex items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{res.name || res.display_name.split(',')[0]}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1">{res.display_name}</div>
                          </div>
                          <button onClick={() => addCustomActivity(res)} className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[11px] font-bold shadow-sm transition-colors shrink-0">Add +</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alternative Experiences & Recommendations */}
                <div className="mt-8 space-y-6">
                  {/* Smart Alternatives */}
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">✨ Alternatively, try these</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.highlights?.filter(a => !plan.activities.find(pa => pa.name === a.name)).slice(0, 4).map(sug => (
                        <div key={sug.name} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3 flex gap-3 group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md transition-all"
                          onClick={() => {
                            addCustomActivity({ name: sug.name, display_name: sug.desc, lat: sug.lat || data.mapCenter.lat, lon: sug.lng || data.mapCenter.lng });
                          }}>
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: \`url(https://images.unsplash.com/photo-\${sug.img}?auto=format&fit=crop&w=150&q=70)\` }} />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">{sug.name}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{sug.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stay & Dine (Moved from Map Sidebar) */}
                  {(data.hotels?.length > 0 || data.restaurants?.length > 0) && (
                    <div className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 p-4 space-y-5">
                      {data.hotels && data.hotels.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">🏨 Top Recommended Stay</h4>
                          <div className="flex gap-4 cursor-pointer group" onClick={() => router.push(\`/itinerary/detail?type=hotel&dest=\${destId}&name=\${encodeURIComponent(data.hotels[0].name)}\`)}>
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm">
                              <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: \`url(https://images.unsplash.com/photo-\${data.hotels[0].img}?auto=format&fit=crop&w=150&q=70)\` }} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">{data.hotels[0].name}</div>
                              <div className="text-[11px] text-zinc-500 line-clamp-1 mt-1">{data.hotels[0].type} • {data.hotels[0].priceRange}</div>
                              <div className="text-[10px] font-bold text-emerald-600 mt-1 inline-flex bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">⭐ {data.hotels[0].rating}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {data.restaurants && data.restaurants.length > 0 && (
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">🍽️ Top Dining Pick</h4>
                          <div className="flex gap-4 cursor-pointer group" onClick={() => router.push(\`/itinerary/detail?type=restaurant&dest=\${destId}&name=\${encodeURIComponent(data.restaurants[0].name)}\`)}>
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm">
                              <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: \`url(https://images.unsplash.com/photo-\${data.restaurants[0].img}?auto=format&fit=crop&w=150&q=70)\` }} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">{data.restaurants[0].name}</div>
                              <div className="text-[11px] text-zinc-500 line-clamp-1 mt-1">{data.restaurants[0].cuisine}</div>
                              <div className="text-[10px] font-bold text-amber-600 mt-1 inline-flex bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">⭐ {data.restaurants[0].rating}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Full Sticky Map */}
              <div className="lg:w-[460px] xl:w-[500px]">
                <div className="sticky top-[150px]">
                  <div className="h-[600px] xl:h-[700px] rounded-[2rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl bg-zinc-100 dark:bg-zinc-900">
                    <ItineraryMap
                      pins={mapPins}
                      center={data.mapCenter}
                      zoom={12}
                      showRoute={true}
                      activePin={activeActivity >= 0 ? activeActivity : undefined}
                      onRouteCalculated={(legs) => { if (legs && legs.length > 0) setDayRouteInfo(legs[0]); }}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
              
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* AI Chat Assistant integrated into Day View */}
      <AIChat currentPlans={customPlans} onPlanUpdate={setCustomPlans} />
    </div>
  );
}`;

content = content.replace(/function DayViewPage[\s\S]*?\/\/ ─── MAIN PAGE/, newFn + '\n\n// ─── MAIN PAGE');
fs.writeFileSync(file, content);
