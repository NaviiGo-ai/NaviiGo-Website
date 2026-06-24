import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { badRequest, validateString, validateNumberArray, KNOWN_DEST_IDS, KNOWN_PURPOSES } from '@/lib/validation';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        // selectedDestId must be a known destination
        const selectedDestId = validateString(body.selectedDestId, 'selectedDestId', 50);
        if (!selectedDestId || !KNOWN_DEST_IDS.has(selectedDestId)) {
            return badRequest(`selectedDestId must be one of the known destination IDs.`);
        }

        // purpose must be a known value
        if (body.purpose !== undefined && !KNOWN_PURPOSES.has(body.purpose)) {
            return badRequest(`purpose must be one of: ${[...KNOWN_PURPOSES].join(', ')}.`);
        }

        // selectedTags must be an array of strings, capped at 20 items
        const rawTags = body.selectedTags;
        const selectedTags: string[] = Array.isArray(rawTags)
            ? rawTags.slice(0, 20).filter((t: unknown) => typeof t === 'string').map((t: string) => t.slice(0, 50))
            : [];

        // currentVector must be an array of finite numbers (max 2048 dims) if provided
        const currentVector = body.currentVector !== undefined && body.currentVector !== null
            ? validateNumberArray(body.currentVector, 2048)
            : null;

        if (body.currentVector !== undefined && body.currentVector !== null && currentVector === null) {
            return badRequest('currentVector must be an array of finite numbers with at most 2048 dimensions.');
        }
        // ─────────────────────────────────────────────────────────────

        // Construct a text string representing the vibe of the selection
        const purpose = body.purpose ?? 'leisure';
        const textToEmbed = `Destination: ${selectedDestId}. Vibe: ${purpose}. Features: ${selectedTags.join(', ')}`;

        // Get the vector for this selection
        const selectionVector = await generateEmbedding(textToEmbed);

        if (!selectionVector) {
            return NextResponse.json({ success: false, error: 'Failed to generate embedding' }, { status: 500 });
        }

        // If user has no vector, their new vector is exactly the selection vector
        if (!currentVector || currentVector.length === 0) {
            return NextResponse.json({ success: true, newVector: selectionVector });
        }

        // Validate dimension parity to prevent vector corruption (NaNs)
        if (currentVector.length !== selectionVector.length) {
            console.warn(`[taste/update] Vector dimension mismatch. Current: ${currentVector.length}, New: ${selectionVector.length}. Overwriting with new vector.`);
            return NextResponse.json({ success: true, newVector: selectionVector });
        }

        // Shift the user's current vector towards the new selection (Exponential Moving Average)
        // 80% old taste, 20% new taste
        const alpha = 0.2;
        const newVector = currentVector.map((val: number, i: number) => {
            return (val * (1 - alpha)) + (selectionVector[i] * alpha);
        });

        return NextResponse.json({ success: true, newVector });

    } catch (err: any) {
        console.error('[taste/update] Error:', err.message);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
