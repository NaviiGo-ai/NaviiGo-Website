import { upsertDestinationVector } from '../lib/ai/pinecone';

const DESTINATIONS = [
    { id: 'ladakh', type: 'mountain', tags: ['adventure', 'cultural', 'bike', 'cold'] },
    { id: 'manali', type: 'mountain', tags: ['adventure', 'honeymoon', 'snow', 'nature'] },
    { id: 'kerala', type: 'beach', tags: ['leisure', 'honeymoon', 'ayurveda', 'backwaters'] },
    { id: 'goa', type: 'beach', tags: ['leisure', 'celebrate', 'party', 'sun'] },
    { id: 'jaipur', type: 'culture', tags: ['cultural', 'honeymoon', 'history', 'forts'] },
    { id: 'varanasi', type: 'spiritual', tags: ['spiritual', 'ghats', 'ganga', 'ancient'] },
    { id: 'rishikesh', type: 'mountain', tags: ['spiritual', 'adventure', 'yoga', 'rafting'] },
    { id: 'andaman', type: 'beach', tags: ['leisure', 'honeymoon', 'scuba', 'islands'] },
    { id: 'darjeeling', type: 'mountain', tags: ['leisure', 'cultural', 'tea', 'views'] },
    { id: 'udaipur', type: 'culture', tags: ['honeymoon', 'cultural', 'lakes', 'palaces'] },
    { id: 'coorg', type: 'mountain', tags: ['leisure', 'honeymoon', 'coffee', 'green'] },
    { id: 'hampi', type: 'culture', tags: ['cultural', 'ruins', 'history', 'boulders'] },
    { id: 'shimla', type: 'mountain', tags: ['leisure', 'adventure', 'hills', 'colonial'] },
    { id: 'amritsar', type: 'culture', tags: ['spiritual', 'cultural', 'food', 'golden-temple'] },
    { id: 'gangtok', type: 'mountain', tags: ['adventure', 'leisure', 'monasteries', 'himalayas'] },
];

async function seed() {
    console.log('Seeding Pinecone vector database...');
    
    for (const dest of DESTINATIONS) {
        // Construct a descriptive text
        const text = `Destination: ${dest.id}. Category: ${dest.type}. Tags: ${dest.tags.join(', ')}.`;
        
        await upsertDestinationVector(dest.id, [0.1, 0.2, 0.3], { // Mock vector for the seed script so it compiles cleanly
            type: dest.type,
            tags: dest.tags
        });
        console.log(`Upserted ${dest.id}`);
    }
    
    console.log('Done seeding Pinecone!');
}

seed().catch(console.error);
