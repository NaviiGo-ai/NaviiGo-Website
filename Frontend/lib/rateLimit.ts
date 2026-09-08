/**
 * Rate Limiting Middleware
 *
 * Non-breaking rate limiter using in-memory store.
 * Legitimate users won't notice; only abusers hitting limits.
 *
 * Returns: 429 Too Many Requests with Retry-After header
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Keyed by `${namespace}:${ip}` so each route namespace has its own counter
const store: Record<string, RateLimitEntry> = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].resetTime < now) delete store[key];
  }
}, 5 * 60 * 1000);

/**
 * Check whether a given IP has exceeded the rate limit for a namespace.
 *
 * @param ip        - Client IP address
 * @param limit     - Maximum requests allowed per window
 * @param windowMs  - Window duration in ms (default: 60 000 = 1 minute)
 * @param namespace - Logical bucket name so different routes share nothing (default: "default")
 */
export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number = 60_000,
  namespace: string = 'default'
): { allowed: boolean; retryAfter: number } {
  const key = `${namespace}:${ip}`;
  const now = Date.now();

  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, retryAfter: 0 };
  }

  store[key].count++;

  if (store[key].count > limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Convenience helper — call at the top of a route handler.
 * Returns a 429 NextResponse if the IP is rate-limited, otherwise null.
 *
 * Usage:
 *   const limited = applyRateLimit(req, 5, 60_000, 'ai');
 *   if (limited) return limited;
 */
export function applyRateLimit(
  request: any,
  limit: number,
  windowMs: number = 60_000,
  namespace: string = 'default'
): NextResponse | null {
  const ip = getClientIP(request);
  const { allowed, retryAfter } = checkRateLimit(ip, limit, windowMs, namespace);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please slow down.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Namespace': namespace,
        },
      }
    );
  }

  return null;
}

/**
 * Extract client IP from request headers.
 * Works with Vercel / proxied deployments.
 */
export function getClientIP(request: any): string {
  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers?.get('x-real-ip') || '0.0.0.0';
}

/**
 * Helper to generate headers for proxying requests to backend services,
 * preserving client IP in X-Forwarded-For.
 */
export function getProxyHeaders(request: any): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Forwarded-For': getClientIP(request),
  };
}

