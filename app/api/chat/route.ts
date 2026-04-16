import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { message, context, currentPlans } = await req.json();

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return NextResponse.json({
                reply: "AI Chat is in demo mode. Add your GEMINI_API_KEY to .env.local to enable real AI responses.",
                action: null,
            });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiClient: 'naviigo-ai', customHeaders: { 'Referer': 'http://localhost:3000' } });

        const systemContext = `You are NaviiGo's AI travel assistant. You help users edit their travel itinerary.
The current itinerary plans are: ${JSON.stringify(currentPlans, null, 2)}

Conversation so far: ${JSON.stringify(context)}

You can either:
1. Just reply with a helpful message (set action: null)
2. Reply AND suggest an itinerary change (set action with type + payload)

Action types:
- "removeActivity": { dayIndex: number, activityIndex: number }
- "addActivity": { dayIndex: number, activity: { name, desc, time, slot, crowd, crowdTip, lat, lng } }
- "reorderDay": { dayIndex: number, fromIndex: number, toIndex: number }
- "replaceActivity": { dayIndex: number, activityIndex: number, activity: {...} }

Respond with ONLY valid JSON in this format:
{
  "reply": "Natural language reply to user",
  "action": null | { "type": "...", "payload": {...} }
}`;

        const result = await model.generateContent(systemContext + '\n\nUser: ' + message);
        const text = result.response.text();

        // Parse JSON from Gemini response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ reply: text, action: null });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);

    } catch (err: unknown) {
        console.error('[AI Chat Error]', err);
        return NextResponse.json(
            { reply: "I'm having trouble right now. Please try again in a moment.", action: null },
            { status: 200 } // Return 200 so frontend doesn't crash
        );
    }
}
