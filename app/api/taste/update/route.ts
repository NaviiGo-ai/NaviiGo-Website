import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(req: NextRequest) {
    try {
        const { currentVector, selectedDestId, selectedTags, purpose } = await req.json();

        // Construct a text string representing the vibe of the selection
        const textToEmbed = `Destination: ${selectedDestId}. Vibe: ${purpose}. Features: ${selectedTags?.join(', ')}`;
        
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
