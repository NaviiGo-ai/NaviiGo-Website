import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/** Normalize city name to a key */
function normalizeKey(dest: string): string {
    return dest.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace(/backwaters|beaches|city/gi, '')
        .replace(/[^a-z]/g, '');
}
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Rate limit: 10 requests per minute per IP
    const ip = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(ip, 10, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
        );
    }

    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        
        console.log(`[Proxy] Forwarding deep dive request to Python backend`);
        
        const pythonResponse = await fetch(`${baseUrl}/api/explore/deep-dive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ success: false, error: data.detail || 'Python backend failed' }, { status: pythonResponse.status });
        }

        return NextResponse.json({ success: true, data: data.data || data });
    } catch (error: any) {
        console.error('[Proxy] Deep Dive Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate deep dive' }, { status: 500 });
    }
}
