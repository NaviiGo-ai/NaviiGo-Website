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
        console.warn('No SerpAPI key found. Returning empty events.');
        return [];
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
                description: e.description || '',
                thumbnail: e.thumbnail || '',
                venue: e.venue || { name: '' }
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching live events:', error);
        return [];
    }
}
