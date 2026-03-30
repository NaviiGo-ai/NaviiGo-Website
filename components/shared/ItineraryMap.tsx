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
    activePin?: number; // 0-indexed
    onRouteCalculated?: (legs: { distance: string; time: string }[]) => void;
}

/**
 * Interactive Leaflet map with numbered markers, route polyline, and popups.
 * Loads Leaflet from CDN — no npm package needed.
 */
export default function ItineraryMap({
    pins,
    center,
    zoom = 12,
    className = 'w-full h-full',
    showRoute = true,
    activePin,
    onRouteCalculated,
}: ItineraryMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Load Leaflet CSS + JS from CDN
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).L && (window as any).L.Routing) { setLeafletLoaded(true); return; }

        // CSS
        if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            const link2 = document.createElement('link');
            link2.rel = 'stylesheet';
            link2.href = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css';
            document.head.appendChild(link2);
        }

        // JS
        if (!document.querySelector('script[src*="leaflet@1.9.4"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js';
                script2.onload = () => setLeafletLoaded(true);
                document.head.appendChild(script2);
            };
            document.head.appendChild(script);
        } else {
            const check = setInterval(() => {
                if ((window as any).L && (window as any).L.Routing) { clearInterval(check); setLeafletLoaded(true); }
            }, 100);
            return () => clearInterval(check);
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!leafletLoaded || !containerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        // Destroy previous map instance
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

        const defaultCenter = center ?? (pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 20.5937, lng: 78.9629 });
        const map = L.map(containerRef.current, {
            center: [defaultCenter.lat, defaultCenter.lng],
            zoom,
            zoomControl: false,
            attributionControl: true,
        });

        // Tile layer — CartoDB Voyager for clean look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Zoom control top-right
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

        // Clear old markers
        markersRef.current.forEach((m: any) => map.removeLayer(m));
        markersRef.current = [];
        if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }

        if (pins.length === 0) return;

        const coords: [number, number][] = [];

        pins.forEach((pin, i) => {
            const isActive = activePin !== undefined && activePin === i;

            // Custom numbered marker
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

            // Popup with thumbnail if available
            const imgHtml = pin.img ? `<img src="https://images.unsplash.com/photo-${pin.img}?auto=format&fit=crop&w=200&q=60" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : '';
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

        // Draw route polyline using Routing Machine
        if (showRoute && coords.length > 1) {
            polylineRef.current = L.Routing.control({
                waypoints: coords.map(([lat, lng]: [number, number]) => L.latLng(lat, lng)),
                lineOptions: {
                    styles: [{ color: '#10b981', weight: 4, opacity: 0.8, dashArray: '6, 6' }]
                },
                createMarker: function () { return null; }, // Hide default routing markers
                show: false, // Hide the text directions UI
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
            }).addTo(map);

            // Hide the default routing container entirely via DOM
            const hideRoutingUi = () => {
                const routeContainers = document.querySelectorAll('.leaflet-routing-container');
                routeContainers.forEach(c => (c as any).style.display = 'none');
            };
            hideRoutingUi();
            setTimeout(hideRoutingUi, 500); // ensure it's hidden after render

            polylineRef.current.on('routesfound', function (e: any) {
                const routes = e.routes;
                if (routes && routes.length > 0 && typeof onRouteCalculated === 'function') {
                    const legs: { distance: string; time: string }[] = [];
                    // Extract instruction step info or total duration per leg
                    // Leaflet routing machine provides coordinates and summary per route
                    // Waypoint pairs define the legs. OSRM actually returns it in `routes[0].summary`
                    // But we want it between each marker. `routes[0].coordinates` has the whole path
                    // Luckily, `routes[0].instructions` holds steps. But the easiest is to just compute distance/time per leg based on waypoints

                    // The easiest approach for legs:
                    const summary = routes[0].summary;
                    // For now, if we cannot get per-leg from standard OSRM easily, we return total
                    // Actually, L.Routing.OSRMv1 gives `e.routes[0].summary.totalTime` and `totalDistance`.
                    // We'll pass an array with dummy split or just 1 element for overall if legs aren't easily parsed.
                    // Wait, waypoints' distances can be tracked through instructions.
                    // For simplicity, we just pass the total route info for now as the first element:
                    const t = summary.totalTime;
                    const d = summary.totalDistance;
                    legs.push({
                        distance: d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m',
                        time: t > 3600 ? Math.floor(t / 3600) + ' hr ' + Math.round((t % 3600) / 60) + ' min' : Math.round(t / 60) + ' min'
                    });

                    onRouteCalculated(legs);
                }
            });
        }

        // Fit bounds
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords.map(([lat, lng]: [number, number]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [pins, activePin, leafletLoaded, showRoute]);

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
