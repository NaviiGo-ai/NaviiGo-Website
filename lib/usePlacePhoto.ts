// ─── usePlacePhoto Hook ───────────────────────────────────────────────────────
// Fetches a real Google Places photo for a given place name + city.
// Falls back to the category-based local image if the API fails or is slow.
//
// Usage:
//   const imgUrl = usePlacePhoto('MG Marg', 'Gangtok', fallbackUrl);
//   <img src={imgUrl} />

import { useState, useEffect } from 'react';

// Module-level cache so photos persist across component re-renders & unmounts
const photoCache = new Map<string, string>();

export function usePlacePhoto(
    name: string | undefined,
    city: string | undefined,
    fallback: string,
    width: number = 800
): string {
    const [url, setUrl] = useState(() => {
        if (!name) return fallback;
        const key = `${name}|${city || ''}`.toLowerCase();
        return photoCache.get(key) || fallback;
    });

    useEffect(() => {
        if (!name) return;

        const key = `${name}|${city || ''}`.toLowerCase();
        
        // Already cached
        if (photoCache.has(key)) {
            setUrl(photoCache.get(key)!);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const params = new URLSearchParams({ name, w: String(width) });
                if (city) params.set('city', city);
                
                const res = await fetch(`/api/places/photo?${params}`);
                if (!res.ok) return;
                
                const data = await res.json();
                if (data.url && !cancelled) {
                    photoCache.set(key, data.url);
                    setUrl(data.url);
                }
            } catch {
                // Silently fail — keep the fallback image
            }
        })();

        return () => { cancelled = true; };
    }, [name, city, width]);

    return url;
}
