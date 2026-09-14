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
    onPinClick?: (pinIndex: number) => void;
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
    onPinClick,
    userLocation,
}: ItineraryMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Store latest callbacks to prevent stale closures
    const onRouteCalculatedRef = useRef(onRouteCalculated);
    useEffect(() => {
        onRouteCalculatedRef.current = onRouteCalculated;
    }, [onRouteCalculated]);

    const onPinClickRef = useRef(onPinClick);
    useEffect(() => {
        onPinClickRef.current = onPinClick;
    }, [onPinClick]);

    // Load Leaflet Core JS from CDN (CSS is preloaded in layout.tsx)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).L) {
            setLeafletLoaded(true);
            return;
        }

        // Fallback stylesheet ensure
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
                if ((window as any).L) {
                    clearInterval(check);
                    setLeafletLoaded(true);
                }
            }, 50);
            return () => clearInterval(check);
        }
    }, []);

    // Initialize map once
    useEffect(() => {
        if (!leafletLoaded || !containerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const defaultCenter = center ?? (pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 20.5937, lng: 78.9629 });
        const map = L.map(containerRef.current, {
            center: [defaultCenter.lat, defaultCenter.lng],
            zoom,
            zoomControl: false,
            attributionControl: true,
        });

        // OpenStreetMap Standard Tile Layer (Clean, official OSM, zero watermarks)
        const primaryTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const fallbackTileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(primaryTileUrl, {
            subdomains: ['a', 'b', 'c'],
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        tileLayer.on('tileerror', () => {
            // Fall back to OSM Humanitarian CDN if standard OSM has any network hiccups
            tileLayer.setUrl(fallbackTileUrl);
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapRef.current = map;

        // Auto invalidate size on mount & container resize to guarantee 0 grey tile rendering
        const invalidate = () => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        };

        const t1 = setTimeout(invalidate, 100);
        const t2 = setTimeout(invalidate, 300);
        const t3 = setTimeout(invalidate, 600);
        const t4 = setTimeout(invalidate, 1200);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                invalidate();
            });
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            if (resizeObserver) resizeObserver.disconnect();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [leafletLoaded]);

    // Build pins and route only when pins or showRoute change
    useEffect(() => {
        if (!mapRef.current || !leafletLoaded) return;
        const L = (window as any).L;
        const map = mapRef.current;

        markersRef.current.forEach((m: any) => map.removeLayer(m));
        markersRef.current = [];
        if (polylineRef.current) {
            try { map.removeLayer(polylineRef.current); } catch {}
            polylineRef.current = null;
        }

        if (pins.length === 0) return;

        const coords: [number, number][] = [];

        pins.forEach((pin, i) => {
            const lat = Number(pin.lat);
            const lng = Number(pin.lng);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

            const icon = L.divIcon({
                className: 'custom-map-pin',
                html: `
                <div id="map-pin-el-${i}" style="display:flex; flex-direction:column; align-items:center; transition: all 0.3s ease;">
                    <div style="
                        width: 36px; height: 36px;
                        background: linear-gradient(135deg, #1B1715, #2C2420);
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                        border: 2px solid #FAF6F0;
                        transition: all 0.3s ease;
                    " class="pin-inner">
                        <span style="transform: rotate(45deg); color: #FAF6F0; font-weight: 800; font-size: 13px; font-family: system-ui, sans-serif;">${pin.number}</span>
                    </div>
                </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);
            const imgSrc = pin.img ? (pin.img.startsWith('http') ? pin.img : pin.img.startsWith('/') ? pin.img : '') : '';
            const imgHtml = imgSrc ? `<img src="${imgSrc}" alt="" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;" onerror="this.style.display='none'" />` : '';
            marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          ${imgHtml}
          <div style="font-weight:700;font-size:13px;margin-bottom:2px;color:#1B1715;">${pin.number}. ${pin.label}</div>
        </div>
      `, { closeButton: false, offset: [0, -10] });

            marker.on('click', () => {
                if (typeof onPinClickRef.current === 'function') {
                    onPinClickRef.current(i);
                }
            });

            markersRef.current.push(marker);
            coords.push([lat, lng]);
        });

        // Server-side route calculation proxy — avoids OSRM demo server rate-limits and CORS warnings
        if (showRoute && coords.length > 1) {
            const coordsParam = coords.map(([lat, lng]) => `${lng},${lat}`).join(';');
            fetch(`/api/transport/route-geometry?coords=${encodeURIComponent(coordsParam)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!mapRef.current) return;
                    const pathCoords = data.coordinates || coords;
                    const polyline = L.polyline(pathCoords, {
                        color: '#EC6426',
                        weight: 3.5,
                        opacity: 0.85,
                        dashArray: '6, 6',
                    }).addTo(map);
                    polylineRef.current = polyline;

                    if (typeof onRouteCalculatedRef.current === 'function' && data.distance) {
                        onRouteCalculatedRef.current([{
                            distance: data.distance,
                            time: data.time || 'Calculated',
                        }]);
                    }

                    map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 14, animate: true, duration: 0.8 });
                })
                .catch(() => {
                    if (!mapRef.current) return;
                    const polyline = L.polyline(coords, {
                        color: '#EC6426',
                        weight: 3.5,
                        opacity: 0.85,
                        dashArray: '6, 6',
                    }).addTo(map);
                    polylineRef.current = polyline;
                    map.fitBounds(polyline.getBounds(), { padding: [45, 45], maxZoom: 14, animate: true, duration: 0.8 });
                });
        } else if (coords.length > 0) {
            const bounds = L.latLngBounds(coords.map(([lat, lng]: [number, number]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, animate: true, duration: 0.8 });
        }

        // Additional invalidateSize whenever pins change
        setTimeout(() => {
            if (mapRef.current) mapRef.current.invalidateSize();
        }, 200);
    }, [pins, leafletLoaded, showRoute]);

    // Smooth activePin synchronization: Highlight & subtle pan without reloading map
    useEffect(() => {
        if (!mapRef.current || !leafletLoaded) return;
        const map = mapRef.current;

        markersRef.current.forEach((marker: any, idx: number) => {
            const pin = pins[idx];
            if (!pin) return;
            const isActive = activePin !== undefined && activePin === idx;
            const isAnyActive = activePin !== undefined && activePin >= 0;
            const markerEl = marker.getElement();
            if (markerEl) {
                const inner = markerEl.querySelector('.pin-inner');
                if (inner) {
                    if (isActive) {
                        inner.style.background = 'linear-gradient(135deg, #EC6426, #C84E17)';
                        inner.style.width = '44px';
                        inner.style.height = '44px';
                        inner.style.boxShadow = '0 6px 20px rgba(236,100,38,0.5)';
                        markerEl.style.zIndex = '999';
                        markerEl.style.opacity = '1';
                    } else {
                        inner.style.background = 'linear-gradient(135deg, #1B1715, #2C2420)';
                        inner.style.width = '36px';
                        inner.style.height = '36px';
                        inner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                        markerEl.style.zIndex = '100';
                        markerEl.style.opacity = isAnyActive ? '0.6' : '1';
                    }
                }
            }

            if (isActive) {
                marker.openPopup();
                const latLng = marker.getLatLng();
                map.panTo(latLng, { animate: true, duration: 0.6 });
            }
        });
    }, [activePin, pins, leafletLoaded]);

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
                <div className="absolute inset-0 bg-muted-100 dark:bg-muted-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-jungle-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-muted-400">Loading map…</p>
                    </div>
                </div>
            )}
        </div>
    );
}
