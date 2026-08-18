import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generates a numerical vector embedding for a given text using Gemini's embedding model.
 * These vectors are used for semantic similarity matching (e.g., matching a user's taste to a destination's vibe).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        if (!GEMINI_API_KEY) {
            console.warn('[Embeddings] No GEMINI_API_KEY found, returning mock vector for development');
            // Return a mock 768-dimensional vector if no API key is provided
            return Array.from({ length: 768 }, () => Math.random() - 0.5);
        }

        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('[Embeddings] Failed to generate embedding:', error);
        return null;
    }
}

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a score between -1 and 1, where 1 means perfectly identical vibes.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
