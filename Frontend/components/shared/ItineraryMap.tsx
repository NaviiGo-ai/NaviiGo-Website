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
    
    // Store latest onRouteCalculated to prevent stale closures without triggering re-renders
    const onRouteCalculatedRef = useRef(onRouteCalculated);
    useEffect(() => {
        onRouteCalculatedRef.current = onRouteCalculated;
    }, [onRouteCalculated]);

    // Load Leaflet CSS + JS from CDN
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).L && (window as any).L.Routing) { setLeafletLoaded(true); return; }

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
        if (polylineRef.current) {
            try { map.removeControl(polylineRef.current); } catch(e) {}
            try { map.removeLayer(polylineRef.current); } catch(e) {}
            polylineRef.current = null;
        }

        if (pins.length === 0) return;

        const coords: [number, number][] = [];

        pins.forEach((pin, i) => {
            const lat = Number(pin.lat);
            const lng = Number(pin.lng);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

            const isActive = activePin !== undefined && activePin === i;
            const icon = L.divIcon({
                className: 'custom-map-pin',
                html: `
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="
                        width: ${isActive ? 42 : 36}px; height: ${isActive ? 42 : 36}px;
                        background: ${isActive ? 'linear-gradient(135deg, #10b981, #0d9488)' : 'linear-gradient(135deg, #6366f1, #4f46e5)'};
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 2px 4px 10px rgba(0,0,0,0.3);
                        border: 2px solid white;
                    ">
                        <span style="transform: rotate(45deg); color: white; font-weight: 800; font-size: ${isActive ? 16 : 14}px; font-family: system-ui, sans-serif;">${pin.number}</span>
                    </div>
                    ${isActive ? '<div style="position:absolute; bottom:-4px; width:12px; height:4px; background:rgba(0,0,0,0.4); border-radius:50%; filter:blur(2px);"></div>' : ''}
                </div>`,
                iconSize: [isActive ? 42 : 36, isActive ? 42 : 36],
                iconAnchor: [isActive ? 21 : 18, isActive ? 42 : 36],
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);
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
            coords.push([lat, lng]);
        });

        if (showRoute && coords.length > 1) {
            polylineRef.current = L.Routing.control({
                waypoints: coords.map(([lat, lng]: [number, number]) => L.latLng(lat, lng)),
                lineOptions: {
                    styles: [{ color: '#10b981', weight: 4, opacity: 0.8, dashArray: '6, 6' }]
                },
                createMarker: function () { return null; },
                show: false,
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
            }).addTo(map);

            const hideRoutingUi = () => {
                const routeContainers = document.querySelectorAll('.leaflet-routing-container');
                routeContainers.forEach(c => (c as any).style.display = 'none');
            };
            hideRoutingUi();
            setTimeout(hideRoutingUi, 500);

            const fallbackToStraightLines = () => {
                if (polylineRef.current) {
                    try { map.removeControl(polylineRef.current); } catch(err) {}
                    try { map.removeLayer(polylineRef.current); } catch(err) {}
                }
                const latlngs = coords.map(([lat, lng]: [number, number]) => L.latLng(lat, lng));
                polylineRef.current = L.polyline(latlngs, {
                    color: '#10b981', weight: 4, opacity: 0.8, dashArray: '6, 6'
                }).addTo(map);
                if (coords.length > 1) {
                    map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
                }
                
                let totalDist = 0;
                for(let i = 0; i < latlngs.length - 1; i++) {
                    totalDist += latlngs[i].distanceTo(latlngs[i+1]);
                }
                if (typeof onRouteCalculatedRef.current === 'function') {
                    onRouteCalculatedRef.current([{
                        distance: totalDist > 1000 ? (totalDist / 1000).toFixed(1) + ' km (est)' : Math.round(totalDist) + ' m (est)',
                        time: 'Off-road'
                    }]);
                }
            };

            polylineRef.current.on('routesfound', function (e: any) {
                const routes = e.routes;
                if (routes && routes.length > 0) {
                    if (typeof onRouteCalculatedRef.current === 'function') {
                        const summary = routes[0].summary;
                        const t = summary.totalTime;
                        const d = summary.totalDistance;
                        onRouteCalculatedRef.current([{
                            distance: d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m',
                            time: t > 3600 ? Math.floor(t / 3600) + ' hr ' + Math.round((t % 3600) / 60) + ' min' : Math.round(t / 60) + ' min'
                        }]);
                    }
                } else {
                    fallbackToStraightLines();
                }
            });

            polylineRef.current.on('routingerror', function (e: any) {
                fallbackToStraightLines();
            });
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
