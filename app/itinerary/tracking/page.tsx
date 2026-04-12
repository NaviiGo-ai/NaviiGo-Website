'use client';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Wifi, Battery, Phone, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });

const TRIP_ACTIVITIES = [
    { time: '06:30 AM', name: 'Woke up on Houseboat', status: 'completed', icon: '🌅', lat: 9.4900, lng: 76.3350 },
    { time: '07:30 AM', name: 'Breakfast — Fresh fish curry & appam', status: 'completed', icon: '🍳', lat: 9.4910, lng: 76.3360 },
    { time: '09:00 AM', name: 'Houseboat canal cruise', status: 'completed', icon: '🚤', lat: 9.4981, lng: 76.3388 },
    { time: '11:00 AM', name: 'Village Walk & Toddy Shop', status: 'active', icon: '🏘️', lat: 9.5050, lng: 76.3400 },
    { time: '01:00 PM', name: 'Lunch on the Houseboat', status: 'upcoming', icon: '🍽️', lat: 9.5100, lng: 76.3420 },
    { time: '03:30 PM', name: 'Coir Making Workshop', status: 'upcoming', icon: '🧶', lat: 9.5200, lng: 76.3500 },
    { time: '05:30 PM', name: 'Backwater Sunset Cruise', status: 'upcoming', icon: '🌅', lat: 9.5100, lng: 76.3450 },
    { time: '08:00 PM', name: 'Overnight Candlelit Dinner', status: 'upcoming', icon: '🕯️', lat: 9.5000, lng: 76.3380 },
];

interface WeatherData {
    temp: number;
    condition: string;
    emoji: string;
    rainChance: number;
    windSpeed: number;
}

export default function TrackingPage() {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'active' | 'denied'>('idle');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [nearbyActivity, setNearbyActivity] = useState<number | null>(null);
    const [completedByGps, setCompletedByGps] = useState<Set<number>>(new Set());

    const tripCenter = { lat: 9.4981, lng: 76.3388 };

    // ── Live GPS Tracking ────────────────────────────────────────
    const startGPS = useCallback(() => {
        if (!navigator.geolocation) { setGpsStatus('denied'); return; }
        setGpsStatus('loading');
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setUserLocation({ lat, lng });
                setGpsStatus('active');

                // Auto-complete activities within 200 m
                TRIP_ACTIVITIES.forEach((act, i) => {
                    if (act.status !== 'upcoming') return;
                    const distM = haversineM(lat, lng, act.lat, act.lng);
                    if (distM < 200) {
                        setNearbyActivity(i);
                        setCompletedByGps(prev => new Set(prev).add(i));
                    }
                });
            },
            () => setGpsStatus('denied'),
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // ── Live Weather ─────────────────────────────────────────────
    useEffect(() => {
        fetch(`/api/weather?lat=${tripCenter.lat}&lng=${tripCenter.lng}`)
            .then(r => r.json())
            .then(d => setWeather(d.current))
            .catch(() => { });
    }, []);

    const mapPins = TRIP_ACTIVITIES.filter(a => a.lat).map((a, i) => ({
        lat: a.lat, lng: a.lng, label: a.name, number: i + 1,
    }));

    const activeIndex = TRIP_ACTIVITIES.findIndex(a => a.status === 'active');

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Live Tracking</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time GPS with auto activity detection</p>
                        </div>
                        {/* GPS Toggle */}
                        <button onClick={startGPS} disabled={gpsStatus === 'active' || gpsStatus === 'loading'}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${gpsStatus === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                                    gpsStatus === 'denied' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                                }`}>
                            <span className={gpsStatus === 'active' ? 'animate-pulse' : ''}>{gpsStatus === 'active' ? '🟢' : gpsStatus === 'loading' ? '⏳' : gpsStatus === 'denied' ? '🚫' : '📍'}</span>
                            {gpsStatus === 'active' ? 'GPS Active' : gpsStatus === 'loading' ? 'Starting…' : gpsStatus === 'denied' ? 'GPS Denied' : 'Start GPS'}
                        </button>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Map Area */}
                    <div className="flex-1">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">

                            {/* Live Map */}
                            <div className="h-[420px]">
                                <ItineraryMap
                                    pins={mapPins}
                                    center={tripCenter}
                                    zoom={12}
                                    showRoute={true}
                                    activePin={activeIndex}
                                    userLocation={userLocation}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Status bar */}
                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold ${gpsStatus === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                                            {gpsStatus === 'active' ? 'Live GPS' : 'GPS Off'}
                                        </div>
                                        {userLocation && (
                                            <span className="text-xs text-zinc-500">{userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E</span>
                                        )}
                                    </div>

                                    {/* Live Weather */}
                                    {weather && (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl">
                                            <span className="text-lg">{weather.emoji}</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{weather.temp}°C</span>
                                            <span className="text-zinc-500 dark:text-zinc-400">{weather.condition}</span>
                                            {weather.rainChance > 30 && (
                                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">🌧️ {weather.rainChance}% rain</span>
                                            )}
                                        </div>
                                    )}

                                    <button className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors">
                                        <Phone className="w-3 h-3" /> SOS
                                    </button>
                                </div>

                                {/* Nearby alert */}
                                {nearbyActivity !== null && !completedByGps.has(nearbyActivity) && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                                        <span className="text-xl">📍</span>
                                        <div>
                                            <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">You're nearby!</div>
                                            <div className="text-xs text-emerald-700 dark:text-emerald-400">{TRIP_ACTIVITIES[nearbyActivity]?.name} — auto-completing…</div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Timeline Sidebar */}
                    <div className="lg:w-[340px]">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-5">
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" /> Today&apos;s Schedule
                            </h3>
                            <div className="space-y-0">
                                {TRIP_ACTIVITIES.map((item, i) => {
                                    const isGpsDone = completedByGps.has(i);
                                    const isDone = item.status === 'completed' || isGpsDone;
                                    const isActive = item.status === 'active' && !isGpsDone;
                                    const isLast = i === TRIP_ACTIVITIES.length - 1;
                                    return (
                                        <div key={i} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all border-2 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                        isActive ? 'bg-white dark:bg-zinc-900 border-red-500 shadow-lg shadow-red-500/20' :
                                                            'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
                                                    }`}>
                                                    {isDone ? '✓' : item.icon}
                                                </div>
                                                {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${isDone ? 'bg-emerald-400' : isActive ? 'bg-red-300 dark:bg-red-800' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                                            </div>
                                            <div className="pb-4 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-red-600 dark:text-red-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                                                        {item.time}
                                                    </span>
                                                    {isActive && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">Now</span>}
                                                    {isGpsDone && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">Auto ✓</span>}
                                                </div>
                                                <div className={`text-sm font-semibold mt-0.5 ${isActive ? 'text-zinc-900 dark:text-white' : isDone ? 'text-zinc-500 dark:text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                    {item.name}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
