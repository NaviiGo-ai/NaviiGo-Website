'use client';

// ─── PlaceImage Component ─────────────────────────────────────────────────────
// Renders an image for a place/hotel/restaurant, automatically fetching a real
// Google Places photo. Falls back to category-based local images.
//
// Usage:
//   <PlaceImage name="MG Marg" city="Gangtok" fallbackSrc={resolveImgSrc(...)} className="h-28" />

import { usePlacePhoto } from '@/lib/usePlacePhoto';

interface PlaceImageProps {
    name: string;
    city?: string;
    fallbackSrc: string;
    className?: string;
    width?: number;
    style?: React.CSSProperties;
    asBackground?: boolean;
}

export default function PlaceImage({ name, city, fallbackSrc, className = '', width = 800, style, asBackground = false }: PlaceImageProps) {
    const src = usePlacePhoto(name, city, fallbackSrc, width);

    if (asBackground) {
        return (
            <div
                className={`bg-cover bg-center ${className}`}
                style={{ ...style, backgroundImage: `url(${src})` }}
            />
        );
    }

    return (
        <img
            src={src}
            alt={name}
            className={`object-cover ${className}`}
            style={style}
            loading="lazy"
            onError={(e) => {
                // Fall back to category image if Places photo fails to load
                e.currentTarget.src = fallbackSrc;
                e.currentTarget.onerror = null;
            }}
        />
    );
}
