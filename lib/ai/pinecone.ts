import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'naviigo-vectors';

// Only initialize if we have the key, otherwise we'll run in mock mode
const pc = PINECONE_API_KEY ? new Pinecone({ apiKey: PINECONE_API_KEY }) : null;

export interface DestinationVectorMatch {
    id: string; // The destination ID (e.g., 'goa', 'manali')
    score: number; // Similarity score (0-1)
    metadata?: any;
}

/**
 * Searches the Pinecone Vector Database for destinations that semantically match the user's taste vector.
 */
export async function searchDestinationsByVibe(
    userTasteVector: number[], 
    topK: number = 10
): Promise<DestinationVectorMatch[]> {
    if (!pc) {
        console.warn('[Pinecone] No PINECONE_API_KEY found. Returning mock semantic matches.');
        return mockVectorSearch(topK);
    }

    try {
        const index = pc.Index(PINECONE_INDEX_NAME);
        
        const queryResponse = await index.query({
            vector: userTasteVector,
            topK,
            includeMetadata: true,
        });

        return queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score ?? 0,
            metadata: match.metadata,
        }));
    } catch (error) {
        console.error('[Pinecone] Vector search failed:', error);
        return mockVectorSearch(topK);
    }
}

/**
 * Uploads a destination's semantic embedding to Pinecone.
 * (Used by the data ingestion pipeline).
 */
export async function upsertDestinationVector(id: string, vector: number[], metadata: any = {}) {
    if (!pc) return;
    
    try {
        const index = pc.Index(PINECONE_INDEX_NAME);
        await index.upsert([{
            id,
            values: vector,
            metadata,
        }] as any);
        console.log(`[Pinecone] Successfully upserted vector for destination: ${id}`);
    } catch (error) {
        console.error(`[Pinecone] Failed to upsert vector for ${id}:`, error);
    }
}

// Fallback for development without API keys
function mockVectorSearch(topK: number): DestinationVectorMatch[] {
    const fallbackIds = ['goa', 'manali', 'varanasi', 'udaipur', 'munnar', 'jaipur'];
    return fallbackIds.slice(0, topK).map(id => ({
        id,
        score: 0.8 + (Math.random() * 0.15), // Mock high similarity score
        metadata: { source: 'mock_fallback' }
    }));
}
