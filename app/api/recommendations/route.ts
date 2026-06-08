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
        const { uid, budget, month, group, purpose, preferences, pastDestinations, tasteVector, browsingSignals } = await req.json();

        const currentMonth = month || new Date().getMonth() + 1; // 1-12
        const budgetNum = Number(budget) || 15000;

        // ── Process Browsing Signals ──
        let finalVector = tasteVector || [];
        if (browsingSignals) {
            const { clickedCategories, viewedDestinations } = browsingSignals;
            if ((clickedCategories && clickedCategories.length > 0) || (viewedDestinations && viewedDestinations.length > 0)) {
                const signalText = `User is implicitly interested in categories: ${clickedCategories?.join(', ') || 'none'}. 
                                    They recently viewed destinations: ${viewedDestinations?.join(', ') || 'none'}.`;
                const signalVector = await generateEmbedding(signalText);
                
                if (signalVector) {
                    if (finalVector.length === 0) {
                        finalVector = signalVector;
                    } else if (finalVector.length === signalVector.length) {
                        // 50/50 blend between explicit taste and implicit browsing signals
                        finalVector = finalVector.map((val: number, i: number) => (val * 0.5) + (signalVector[i] * 0.5));
                    }
                }
            }
        }

        // Fetch semantic matches from Pinecone if finalVector exists
        let semanticMatches: DestinationVectorMatch[] = [];
        if (finalVector && finalVector.length > 0) {
            semanticMatches = await searchDestinationsByVibe(finalVector, 15);
        }

        // Score each destination
        const scored: Array<{ id: string; name: string; score: number; reasons: string[]; monthScore: number }> = [];

        for (const [id, meta] of Object.entries(DEST_META)) {
            let score = 50;
            const reasons: string[] = [];

            // 1. Month/season fit (most important)
            const monthFit = meta.idealMonths.includes(currentMonth);
            const monthScore = monthFit ? 30 : -10;
            if (monthFit) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                reasons.push(`🗓️ Perfect season — ${monthNames[currentMonth - 1]} is ideal`);
            }
            score += monthScore;

            // 2. Purpose alignment
            if (purpose && meta.types.includes(purpose)) {
                score += 25;
                reasons.push(`🎯 Matches your ${purpose} travel style`);
            } else if (purpose) {
                score -= 10;
            }

            // 3. Budget fit (rough estimates per day per person)
            const estimatedDailyMin: Record<string, number> = {
                andaman: 5000, manali: 2500, ladakh: 3000, kerala: 3000,
                goa: 3500, jaipur: 2000, varanasi: 1500, rishikesh: 1800,
                darjeeling: 2000, udaipur: 2500, coorg: 2500, hampi: 1500,
                shimla: 2000, amritsar: 1800, gangtok: 2500,
            };
            const dailyMin = estimatedDailyMin[id] || 2000;
            const budgetFit = budgetNum >= dailyMin * 3; // at least 3 days comfortable
            if (budgetFit) {
                score += 15;
                reasons.push(`💰 Within your ₹${budgetNum.toLocaleString('en-IN')} budget`);
            } else {
                score -= 15;
            }

            // 4. Novelty boost — destinations user hasn't visited
            if (pastDestinations?.length && !pastDestinations.includes(id)) {
                score += 10;
                reasons.push('✨ New destination for you');
            }

            // 5. Group fit
            const groupFit: Record<string, string[]> = {
                solo: ['rishikesh', 'hampi', 'varanasi', 'darjeeling', 'gangtok'],
                couple: ['udaipur', 'coorg', 'andaman', 'kerala', 'goa'],
                family: ['shimla', 'manali', 'jaipur', 'amritsar', 'kerala'],
                friends: ['goa', 'rishikesh', 'manali', 'coorg', 'ladakh'],
                honeymoon: ['udaipur', 'kerala', 'andaman', 'coorg', 'goa'],
            };
            const groupDests = groupFit[group as string] || [];
            if (groupDests.includes(id)) {
                score += 15;
                reasons.push(`👥 Great for ${group} travel`);
            }

            // 6. User preference interests boost
            if (preferences?.interests?.length) {
                const interestMap: Record<string, string[]> = {
                    'Trekking': ['manali', 'ladakh', 'rishikesh', 'darjeeling', 'gangtok'],
                    'Beaches': ['goa', 'andaman', 'kerala'],
                    'History': ['jaipur', 'hampi', 'amritsar', 'varanasi'],
                    'Food': ['amritsar', 'jaipur', 'kerala', 'goa'],
                    'Photography': ['ladakh', 'hampi', 'jaipur', 'varanasi', 'darjeeling'],
                    'Wellness': ['rishikesh', 'kerala', 'coorg'],
                    'Wildlife': ['coorg', 'kerala', 'andaman'],
                };
                for (const interest of preferences.interests) {
                    if (interestMap[interest]?.includes(id)) {
                        score += 12;
                        reasons.push(`❤️ Matches your interest in ${interest}`);
                        break;
                    }
                }
            }

            const prettyNames: Record<string, string> = {
                ladakh: 'Ladakh', manali: 'Manali', kerala: 'Kerala', goa: 'Goa',
                jaipur: 'Jaipur', varanasi: 'Varanasi', rishikesh: 'Rishikesh',
                andaman: 'Andaman', darjeeling: 'Darjeeling', udaipur: 'Udaipur',
                coorg: 'Coorg', hampi: 'Hampi', shimla: 'Shimla', amritsar: 'Amritsar', gangtok: 'Gangtok',
            };

            // 7. Vector Database Semantic Match (The Netflix-style personalization)
            if (semanticMatches.length > 0) {
                const vectorMatch = semanticMatches.find(m => m.id === id);
                if (vectorMatch) {
                    // vectorMatch.score is between 0 and 1. We scale it heavily to boost its impact.
                    const vectorBoost = Math.round(vectorMatch.score * 40);
                    score += vectorBoost;
                    if (vectorBoost > 25) {
                        reasons.unshift(`🔮 Perfect match for your unique travel taste!`);
                    }
                }
            }

            scored.push({ id, name: prettyNames[id] || id, score, reasons: reasons.slice(0, 3), monthScore });
        }

        // Sort by score, take top 5
        const top5 = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(d => ({ ...d, score: Math.min(99, Math.max(50, d.score)) }));

        // Optionally enhance with Gemini personalized blurbs
        let enhanced = top5;
        if (GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

                const prompt = `Create ultra-short personalized travel pitch lines for these Indian destinations for a traveler going in ${new Date(0, currentMonth - 1).toLocaleString('en', { month: 'long' })} with purpose "${purpose}" and group type "${group}".

Destinations: ${top5.map(d => d.name).join(', ')}

Return ONLY JSON array (no markdown):
[
  { "id": "${top5[0]?.id}", "pitch": "One exciting sentence why this is perfect RIGHT NOW for them" },
  ...
]`;

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const arrMatch = text.match(/\[[\s\S]*\]/);
                if (arrMatch) {
                    const pitches: Array<{ id: string; pitch: string }> = JSON.parse(arrMatch[0]);
                    enhanced = top5.map(d => ({
                        ...d,
                        pitch: pitches.find(p => p.id === d.id)?.pitch || '',
                    }));
                }
            } catch {
                // Gemini enhancement optional — continue without it
            }
        }

        return NextResponse.json({ success: true, recommendations: enhanced });

    } catch (err: any) {
        console.error('[recommendations] Error:', err.message);
        return NextResponse.json({ success: false, error: 'Failed to generate recommendations' }, { status: 500 });
    }
}
