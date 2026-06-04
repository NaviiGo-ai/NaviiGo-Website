import { NextResponse } from 'next/server';
import { getLiveEvents } from '@/lib/api/googleEvents';

export async function POST(req: Request) {
    try {
        const { destination } = await req.json();
        
        if (!destination) {
            return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
        }

        const events = await getLiveEvents(destination);
        
        return NextResponse.json({ events });
    } catch (error: any) {
        console.error('Events API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
    }
}
