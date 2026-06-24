import { NextResponse } from 'next/server';
import { badRequest, validateString } from '@/lib/validation';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        const safeBody = { destination };
        // ─────────────────────────────────────────────────────────────

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Proxy] Forwarding events request to Python backend`);

        const pythonResponse = await fetch(`${baseUrl}/api/explore/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(safeBody),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ error: data.detail || 'Python backend failed' }, { status: pythonResponse.status });
        }

        return NextResponse.json({ events: data.events || data });
    } catch (error: any) {
        console.error('[Proxy] Events Error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
