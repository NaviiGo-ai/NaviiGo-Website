import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
    // Rate limit: 10 requests per minute per IP
    const ip = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(ip, 10, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait before sending another message.' },
            { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
        );
    }

    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        
        console.log(`[Proxy] Forwarding chat request to Python backend`);
        
        const pythonResponse = await fetch(`${baseUrl}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ success: false, error: data.detail || 'Python backend failed' }, { status: pythonResponse.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Proxy] Chat Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
