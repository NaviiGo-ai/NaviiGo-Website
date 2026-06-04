const SERPAPI_KEY = process.env.SERPAPI_API_KEY || '';

export interface LocalEvent {
    title: string;
    date: {
        start_date: string;
        when: string;
    };
    address: string[];
    link: string;
    description: string;
    thumbnail: string;
    venue: {
        name: string;
        rating?: number;
        reviews?: number;
        link?: string;
    };
}

export async function getLiveEvents(destination: string): Promise<LocalEvent[]> {
    if (!SERPAPI_KEY) {
        console.warn('No SerpAPI key found. Returning mock events.');
        return getMockEvents(destination);
    }

    try {
        const query = encodeURIComponent(`events in ${destination}`);
        const url = `https://serpapi.com/search.json?engine=google_events&q=${query}&hl=en&gl=in&api_key=${SERPAPI_KEY}`;

        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!res.ok) {
            throw new Error(`SerpAPI error: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.events_results && data.events_results.length > 0) {
            return data.events_results.slice(0, 8).map((e: any) => ({
                title: e.title,
                date: e.date || { start_date: 'Upcoming', when: 'Check link for dates' },
                address: e.address || [],
                link: e.link || `https://www.google.com/search?q=${encodeURIComponent(e.title + ' ' + destination)}`,
                description: e.description || 'Join this exciting local event.',
                thumbnail: e.thumbnail || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
                venue: e.venue || { name: 'Local Venue' }
            }));
        }

        return getMockEvents(destination);
    } catch (error) {
        console.error('Error fetching live events:', error);
        return getMockEvents(destination);
    }
}

function getMockEvents(destination: string): LocalEvent[] {
    return [
        {
            title: `Weekend Flea Market - ${destination}`,
            date: { start_date: 'Sat, 10 AM', when: 'This Weekend' },
            address: [`Downtown ${destination}`],
            link: `https://in.bookmyshow.com/explore/events-${destination.toLowerCase()}`,
            description: 'Local artisans, indie pop-up stores, and street food all in one place.',
            thumbnail: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80',
            venue: { name: 'City Square' }
        },
        {
            title: `Indie Music Gig`,
            date: { start_date: 'Fri, 8 PM', when: 'This Friday' },
            address: [`Cultural Center, ${destination}`],
            link: `https://insider.in/${destination.toLowerCase()}`,
            description: 'Live acoustic session featuring upcoming local artists.',
            thumbnail: 'https://images.unsplash.com/photo-1540039155733-d76e614847be?auto=format&fit=crop&w=800&q=80',
            venue: { name: 'Cultural Center' }
        }
    ];
}
