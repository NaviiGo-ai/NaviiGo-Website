import { NextRequest } from 'next/server';
import { proxyReplan } from '@/lib/replanProxy';
export const POST = (req: NextRequest) => proxyReplan(req, true);
