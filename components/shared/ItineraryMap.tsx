'use client';

import { useEffect, useRef, useState } from 'react';

interface MapPin {
    lat: number;
    lng: number;
    label: string;
    number: number;
    img?: string;
}

interface ItineraryMapProps {
    pins: MapPin[];
    center?: { lat: number; lng: number };
    zoom?: number;
    className?: string;
    showRoute?: boolean;
    activePin?: number;
    onRouteCalculated?: (legs: { distance: string; time: string }[]) => void;
    /** When provided, renders a live pulsing blue dot at the user's location */
    userLocation?: { lat: number; lng: number } | null;
}

export default function ItineraryMap({
    pins,
    center,
    zoom = 12,
    className = 'w-full h-full',
    showRoute = true,
    activePin,
    onRouteCalculated,
    userLocation,
}: ItineraryMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Load Leaflet CSS + JS from CDN
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[src*="leaflet@1.9.4"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => setLeafletLoaded(true);
            document.head.appendChild(script);
        } else {
            const check = setInterval(() => {
                if ((window as any).L) { clearInterval(check); setLeafletLoaded(true); }
            }, 100);
            return () => clearInterval(check);
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!leafletLoaded || !containerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

        const defaultCenter = center ?? (pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 20.5937, lng: 78.9629 });
        const map = L.map(containerRef.current, {
            center: [defaultCenter.lat, defaultCenter.lng],
            zoom,
            zoomControl: false,
            attributionControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);
        mapRef.current = map;

        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leafletLoaded]);

    // Update markers & route when pins change
    useEffect(() => {
        if (!mapRef.current || !leafletLoaded) return;
        const L = (window as any).L;
        const map = mapRef.current;

        markersRef.current.forEach((m: any) => map.removeLayer(m));
        markersRef.current = [];
        if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }

        if (pins.length === 0) return;

        const coords: [number, number][] = [];

        pins.forEach((pin, i) => {
            const isActive = activePin !== undefined && activePin === i;

            const icon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div style="
          width:${isActive ? 36 : 30}px; height:${isActive ? 36 : 30}px;
          background: ${isActive ? '#059669' : '#10b981'};
          border: 3px solid white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: ${isActive ? 14 : 12}px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: ${isActive ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.3s ease;
          font-family: system-ui, sans-serif;
        ">${pin.number}</div>`,
                iconSize: [isActive ? 36 : 30, isActive ? 36 : 30],
                iconAnchor: [isActive ? 18 : 15, isActive ? 18 : 15],
            });

            const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
            const imgSrc = pin.img ? (pin.img.startsWith('http') ? pin.img : pin.img.startsWith('/') ? pin.img : `/destinations/delhi.png`) : '';
            const imgHtml = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;" onerror="this.style.display='none'" />` : '';
            marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          ${imgHtml}
          <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${pin.number}. ${pin.label}</div>
        </div>
      `, { closeButton: false, offset: [0, -10] });

            if (isActive) marker.openPopup();
            markersRef.current.push(marker);
            coords.push([pin.lat, pin.lng]);
        });

        if (showRoute && coords.length > 1) {
            polylineRef.current = L.polyline(coords, {
                color: '#10b981',
                weight: 4,
                opacity: 0.8,
                dashArray: '6, 6'
            }).addTo(map);
        }

        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords.map(([lat, lng]: [number, number]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [pins, activePin, leafletLoaded, showRoute]);

    // ── User Location Blue Dot ──────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !leafletLoaded) return;
        const L = (window as any).L;
        const map = mapRef.current;

        if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
        }

        if (!userLocation) return;

        const blueDotIcon = L.divIcon({
            className: '',
            html: `
        <div style="position:relative;width:24px;height:24px;">
          <div style="
            position:absolute;inset:0;
            background:rgba(59,130,246,0.25);
            border-radius:50%;
            animation: gps-pulse 2s infinite;
          "></div>
          <div style="
            position:absolute;
            top:50%;left:50%;
            transform:translate(-50%,-50%);
            width:14px;height:14px;
            background:#3b82f6;
            border:2.5px solid white;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(59,130,246,0.5);
          "></div>
        </div>
      `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        // Inject CSS for pulse animation once
        if (!document.getElementById('gps-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'gps-pulse-style';
            style.textContent = `@keyframes gps-pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.5);opacity:0} }`;
            document.head.appendChild(style);
        }

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: blueDotIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup('<div style="font-size:13px;font-weight:700">📍 You are here</div>', { offset: [0, -12] });

        map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 13));
    }, [userLocation, leafletLoaded]);

    return (
        <div className={`relative rounded-2xl overflow-hidden ${className}`}>
            <div ref={containerRef} className="w-full h-full min-h-[300px]" />
            {!leafletLoaded && (
                <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-zinc-400">Loading map…</p>
                    </div>
                </div>
            )}
        </div>
    );
}
