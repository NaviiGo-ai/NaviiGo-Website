'use client';
// ─── WeatherStrip ─────────────────────────────────────────────────────────────
// Live weather for a destination, fetched via the same-origin /api/weather route
// (Open-Meteo — 100% free, no key). Renders nothing when the feed is unavailable
// so pages degrade gracefully offline or during Open-Meteo outages.

import { useEffect, useState } from 'react';
import { Droplets, Umbrella, Wind } from 'lucide-react';

interface WeatherDay {
    date: string;
    maxTemp: number;
    minTemp: number;
    rainChance: number;
    condition: string;
    emoji: string;
}

interface WeatherPayload {
    current: {
        temp: number;
        feelsLike: number;
        humidity: number;
        rainChance: number;
        windSpeed: number;
        condition: string;
        emoji: string;
    } | null;
    daily: WeatherDay[];
    error?: boolean;
    _mock?: boolean;
}

// Short client-side cache — the route is expensive-ish on cold open-meteo calls.
const cache = new Map<string, { ts: number; data: WeatherPayload }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface Props {
    lat: number;
    lng: number;
    label?: string;
    /** Hide the seven-day forecast, show only the current pill. */
    compact?: boolean;
}

export default function WeatherStrip({ lat, lng, label, compact = false }: Props) {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<WeatherPayload | null>(null);

    useEffect(() => {
        let cancelled = false;
        const key = `${lat.toFixed(3)}|${lng.toFixed(3)}`;

        const apply = (d: WeatherPayload | null) => {
            const ok = !!d && !!d.current && !d.error && !d._mock;
            if (cancelled) return;
            setData(d);
            setVisible(ok);
        };

        const cached = cache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            apply(cached.data);
            return;
        }

        (async () => {
            try {
                const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
                if (!res.ok) throw new Error(`weather ${res.status}`);
                const d: WeatherPayload = await res.json();
                cache.set(key, { ts: Date.now(), data: d });
                apply(d);
            } catch {
                apply(null);
            }
        })();

        return () => { cancelled = true; };
    }, [lat, lng]);

    if (!visible || !data?.current) return null;

    const c = data.current;
    const days = (data.daily || []).slice(0, compact ? 3 : 7);
    const weekday = (iso: string) => {
        const d = new Date(`${iso}T00:00:00`);
        const today = new Date();
        const sameDay = d.toDateString() === today.toDateString();
        return sameDay ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    };

    return (
        <section
            aria-label={`Live weather${label ? ` in ${label}` : ''}`}
            className="rounded-2xl border border-muted-200 dark:border-white/10 bg-white/70 dark:bg-muted-900/60 backdrop-blur px-4 py-3 shadow-sm"
        >
            <div className="flex items-center gap-4 flex-wrap">
                {/* Current conditions */}
                <div className="flex items-center gap-3">
                    <span className="text-3xl" role="img" aria-label={c.condition}>{c.emoji}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-muted-900 dark:text-white leading-none">{c.temp}°C</span>
                            <span className="relative flex h-2 w-2" title="Live from Open-Meteo">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jungle-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-jungle-green-500" />
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-muted-600 dark:text-muted-300">{c.condition}{label ? ` · ${label}` : ''}</p>
                    </div>
                    <dl className="hidden sm:flex items-center gap-3 text-xs text-muted-500 dark:text-muted-400 ml-2">
                        <div className="flex items-center gap-1" title="Feels like"><ThermIcon />{c.feelsLike}°</div>
                        <div className="flex items-center gap-1" title="Humidity"><Droplets className="w-3.5 h-3.5" />{c.humidity}%</div>
                        <div className="flex items-center gap-1" title="Wind"><Wind className="w-3.5 h-3.5" />{c.windSpeed} km/h</div>
                        <div className="flex items-center gap-1" title="Rain chance"><Umbrella className="w-3.5 h-3.5" />{c.rainChance}%</div>
                    </dl>
                </div>

                {/* Seven-day forecast */}
                {days.length > 0 && (
                    <div className="flex-1 min-w-0">
                        <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
                            {days.map((d) => (
                                <div key={d.date} className="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[52px] px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-400">{weekday(d.date)}</span>
                                    <span className="text-base" role="img" aria-label={d.condition}>{d.emoji}</span>
                                    <span className="text-[11px] font-semibold text-muted-700 dark:text-muted-200 whitespace-nowrap">{d.minTemp}°–{d.maxTemp}°</span>
                                    <span className="text-[10px] text-muted-400 flex items-center gap-0.5 whitespace-nowrap">{d.rainChance > 0 && <Umbrella className="w-2.5 h-2.5" />}{d.rainChance}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function ThermIcon() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
        </svg>
    );
}
