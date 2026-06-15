import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchDestinationsByVibe, DestinationVectorMatch } from '@/lib/ai/pinecone';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

// Destination metadata with rough coordinates and characteristics
const DEST_META: Record<string, { lat: number; lng: number; state: string; types: string[]; idealMonths: number[] }> = {
    ladakh: { lat: 34.23, lng: 77.56, state: 'Ladakh', types: ['adventure', 'cultural'], idealMonths: [5, 6, 7, 8, 9] },
    manali: { lat: 32.24, lng: 77.19, state: 'Himachal Pradesh', types: ['adventure', 'honeymoon'], idealMonths: [3, 4, 5, 6, 10, 11] },
    kerala: { lat: 9.93, lng: 76.27, state: 'Kerala', types: ['leisure', 'honeymoon'], idealMonths: [10, 11, 12, 1, 2, 3] },
    goa: { lat: 15.30, lng: 74.12, state: 'Goa', types: ['leisure', 'celebrate'], idealMonths: [11, 12, 1, 2, 3] },
    jaipur: { lat: 26.91, lng: 75.79, state: 'Rajasthan', types: ['cultural', 'honeymoon'], idealMonths: [10, 11, 12, 1, 2] },
    varanasi: { lat: 25.32, lng: 83.01, state: 'UP', types: ['spiritual'], idealMonths: [10, 11, 12, 1, 2] },
    rishikesh: { lat: 30.09, lng: 78.27, state: 'Uttarakhand', types: ['spiritual', 'adventure'], idealMonths: [3, 4, 5, 9, 10, 11] },
    andaman: { lat: 11.74, lng: 92.66, state: 'Andaman', types: ['leisure', 'honeymoon'], idealMonths: [11, 12, 1, 2, 3, 4] },
    darjeeling: { lat: 27.04, lng: 88.26, state: 'WB', types: ['leisure', 'cultural'], idealMonths: [3, 4, 5, 9, 10, 11] },
    udaipur: { lat: 24.58, lng: 73.68, state: 'Rajasthan', types: ['honeymoon', 'cultural'], idealMonths: [10, 11, 12, 1, 2] },
    coorg: { lat: 12.32, lng: 75.81, state: 'Karnataka', types: ['leisure', 'honeymoon'], idealMonths: [10, 11, 12, 1, 2, 3] },
    hampi: { lat: 15.34, lng: 76.46, state: 'Karnataka', types: ['cultural'], idealMonths: [10, 11, 12, 1, 2] },
    shimla: { lat: 31.10, lng: 77.17, state: 'Himachal Pradesh', types: ['leisure', 'adventure'], idealMonths: [3, 4, 5, 6, 11, 12] },
    amritsar: { lat: 31.63, lng: 74.87, state: 'Punjab', types: ['spiritual', 'cultural'], idealMonths: [10, 11, 12, 1, 2, 3] },
    gangtok: { lat: 27.34, lng: 88.61, state: 'Sikkim', types: ['adventure', 'leisure'], idealMonths: [3, 4, 5, 9, 10, 11] },
};

export async function POST(req: NextRequest) {
    // Rate limit: 5 requests per minute per IP
    const ip = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(ip, 5, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many recommendation requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
        );
    }

    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        
        console.log(`[Proxy] Forwarding recommendations request to Python backend`);
        
        const pythonResponse = await fetch(`${baseUrl}/api/recommendations/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ success: false, error: data.detail || 'Python backend failed' }, { status: pythonResponse.status });
        }

        return NextResponse.json({ success: true, recommendations: data.recommendations || data });
    } catch (error: any) {
        console.error('[Proxy] Recommendations Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
