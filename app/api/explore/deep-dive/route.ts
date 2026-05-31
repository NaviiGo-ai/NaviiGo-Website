import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/** Normalize city name to a key */
function normalizeKey(dest: string): string {
    return dest.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace(/backwaters|beaches|city/gi, '')
        .replace(/[^a-z]/g, '');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { destination, companion = 'Solo', vibe = 'Explore everything' } = body;

        console.log(`[Explore Deep Dive] Triggered for: ${destination} | ${companion} | ${vibe}`);

        // Try Gemini API first
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                const model = genAI.getGenerativeModel(
                    { model: 'gemini-2.5-flash' },
                );

                const prompt = `You are an incredibly authentic and brutally honest local travel expert and Reddit travel community synthesizer.
The destination is: ${destination}.
The traveler group is: ${companion}.
Their primary goal/vibe is: ${vibe}.

Respond strictly with a RAW VALID JSON object. Do not include markdown formatting like \`\`\`json. 
Provide highly specific and curated recommendations that reflect true local insights, not generic tourist brochures.

Must exactly match this structure:
{
    "redditConsensus": "A 2-3 sentence brutally honest summary of what actual travelers (e.g. on Reddit) say about this city given the context of a ${companion} trip.",
    "hiddenGems": [
        { "name": "Name of secret spot", "desc": "Why it's amazing and fits the vibe." } // exactly 3 items
    ],
    "touristTrapsToAvoid": [
        { "trap": "Name of popular overrated spot", "betterAlternative": "The authentic alternative to go to instead." } // exactly 2 items
    ],
    "instagramWorthy": [
        { "spot": "Name of aesthetic spot", "bestTime": "Best lighting/time to go" } // exactly 3 items
    ],
    "localFoodMustHaves": [
        { "dish": "Name of specific local dish", "where": "Name of a highly rated specific local restaurant/stall to get it" } // exactly 3 items
    ]
}`;

                const result = await model.generateContent(prompt);
                let text = result.response.text().trim();
                
                // Clean markdown code blocks if the AI accidentally generates them
                if (text.startsWith('```json')) text = text.substring(7);
                if (text.startsWith('```')) text = text.substring(3);
                if (text.endsWith('```')) text = text.substring(0, text.length - 3);

                const data = JSON.parse(text.trim());
                console.log('[Explore Deep Dive] Gemini response OK');
                return NextResponse.json(data);
            } catch (geminiError: any) {
                console.warn('[Explore Deep Dive] Gemini failed, falling back to generic data:', geminiError.message);
            }
        }

        // Generic fallback for any destination when Gemini is unavailable
        return NextResponse.json({
            redditConsensus: `${destination} is a treasure that travelers consistently recommend. Locals are friendly and the food scene is incredible. Plan 2-3 days minimum, hire a local guide for the best hidden spots, and don't rely only on Google Maps — ask locals for real recommendations.`,
            hiddenGems: [
                { name: `${destination} Old Quarter Walk`, desc: "Explore the heritage lanes and local markets away from the main tourist circuit for an authentic experience." },
                { name: "Local Morning Market", desc: "Wake up early and visit the morning market where locals shop — fresh produce, street snacks, and real conversations." },
                { name: "Sunset Viewpoint", desc: "Ask any rickshaw driver for the best sunset spot — they always know a viewpoint that tourists haven't found on Google Maps yet." },
            ],
            touristTrapsToAvoid: [
                { trap: "Tour packages near major monuments", betterAlternative: "Hire a local guide through your hotel — more personal, more authentic, and half the price." },
                { trap: "Restaurants directly facing tourist landmarks", betterAlternative: "Walk one street back from any landmark — prices drop 60% and the food gets better." },
            ],
            instagramWorthy: [
                { spot: `${destination}'s most iconic landmark`, bestTime: "Sunrise for golden light and no crowds" },
                { spot: "Heritage district streets", bestTime: "Golden hour, 4:00–5:30 PM" },
                { spot: "Local temple or spiritual site", bestTime: "Evening when lamps are lit" },
            ],
            localFoodMustHaves: [
                { dish: "Regional specialty dish", where: "Ask your hotel staff for the most popular local eatery" },
                { dish: "Street-side chai & snacks", where: "Nearest old market — look for the stall with the longest local queue" },
                { dish: "Traditional thali", where: "Any family-run restaurant off the main road" },
            ],
        });

    } catch (error: any) {
        console.error('[Explore Deep Dive Error]', error);
        return NextResponse.json(
            { error: 'Failed to synthesize travel data. Please try again.' },
            { status: 500 }
        );
    }
}
