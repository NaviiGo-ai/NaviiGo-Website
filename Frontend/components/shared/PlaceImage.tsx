'use client';

// ─── PlaceImage Component ─────────────────────────────────────────────────────
// Renders an image for a place/hotel/restaurant, automatically fetching a real
// Google Places photo. When no real photo is available it renders an honest
// empty state — it never fabricates or falls back to a category image.
//
// Usage:
//   <PlaceImage name="MG Marg" city="Gangtok" className="h-28" />

import { usePlacePhoto } from '@/lib/usePlacePhoto';

interface PlaceImageProps {
    name: string;
    city?: string;
    className?: string;
    width?: number;
    style?: React.CSSProperties;
    asBackground?: boolean;
}

export default function PlaceImage({ name, city, className = '', width = 800, style, asBackground = false }: PlaceImageProps) {
    const src = usePlacePhoto(name, city, width);

    // If no photo is available from Google Places API, don't show anything (empty state)
    const displaySrc = src || '';

    if (asBackground) {
        return (
            <div
                className={`bg-cover bg-center ${className}`}
                style={{ ...style, backgroundImage: displaySrc ? `url(${displaySrc})` : 'none' }}
            />
        );
    }

    return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={displaySrc}
            alt={name}
            className={`object-cover ${className}`}
            style={style}
            loading="lazy"
        />
    );
}
