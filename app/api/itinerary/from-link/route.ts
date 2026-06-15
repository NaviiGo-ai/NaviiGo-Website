import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * SECURITY FIX: Removed remote URL fetching to prevent SSRF attacks.
 * Users can paste URL or caption text - both are analyzed as plain text by Gemini.
 * This prevents attackers from probing internal services or metadata endpoints.
 */

/**
 * POST /api/itinerary/from-link
 * Body: { url?: string, captionText?: string }
 * Returns: { destName, places, vibe, days, purpose, tags }
 */
export async function POST(req: NextRequest) {
    try {
        const { url, captionText } = await req.json();

        if (!url && !captionText) {
            return NextResponse.json({ success: false, error: 'Provide url or captionText' }, { status: 400 });
        }

        // Build the text we'll analyze
        // Treat URL as plain text (no fetching) to prevent SSRF attacks
        let analysisText = captionText || '';
        if (url) {
            analysisText = [url, captionText].filter(Boolean).join('\n');
        }

        if (!analysisText.trim()) {
            return NextResponse.json({ success: false, error: 'Could not extract any text. Try pasting the caption text directly.' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            // Demo mode — return mock extraction
            return NextResponse.json({
                success: true,
                extracted: {
                    destName: 'Ladakh',
                    places: ['Pangong Tso', 'Nubra Valley', 'Leh Palace'],
                    vibe: 'adventure',
                    days: 5,
                    purpose: 'adventure',
                    tags: ['Mountains', 'Lakes', 'Road Trip'],
                    confidence: 'demo',
                },
            });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `You are a travel content parser. Extract travel information from this social media content.

Content to analyze:
"""
${analysisText.slice(0, 2000)}
"""

Return ONLY valid JSON (no markdown, no explanation):
{
  "destName": "Primary destination name (Indian city/region, or null if not found)",
  "places": ["List of specific places/attractions mentioned"],
  "vibe": "One of: adventure, spiritual, leisure, cultural, honeymoon, celebrate",
  "days": number or null if not mentioned,
  "purpose": "One of: adventure, spiritual, leisure, cultural, honeymoon, celebrate",
  "tags": ["2-4 descriptive tags like Beaches, Mountains, Food, etc."],
  "summary": "1 sentence describing what this trip is about",
  "confidence": "high/medium/low based on how much travel info was found"
}

If this doesn't seem travel-related, return { "destName": null, "confidence": "low" }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ success: false, error: 'Could not parse travel info from this content.' }, { status: 400 });
        }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        
        console.log(`[Proxy] Forwarding from-link request to Python backend`);
        
        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/from-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ success: false, error: data.detail || 'Python backend failed' }, { status: pythonResponse.status });
        }

        return NextResponse.json({ success: true, extracted: data.extracted || data });
    } catch (error: any) {
        console.error('[Proxy] From-Link Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
