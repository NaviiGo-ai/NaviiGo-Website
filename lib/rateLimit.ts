/**
 * Rate Limiting Middleware
 * 
 * Non-breaking rate limiter using in-memory store.
 * Legitimate users won't notice; only abusers hitting limits.
 * 
 * Returns: 429 Too Many Requests with Retry-After header
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Clean up old entries every 5 minutes
const store: RateLimitStore = {};
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limit by IP address
 * @param ip - Client IP address
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, retryAfter: number }
 */
export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfter: number } {
  const key = `rate-limit:${ip}`;
  const now = Date.now();

  if (!store[key]) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, retryAfter: 0 };
  }

  // Window expired, reset
  if (store[key].resetTime < now) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, retryAfter: 0 };
  }

  // Increment counter
  store[key].count++;

  if (store[key].count > limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Extract client IP from request headers
 * Works with Vercel deployment
 */
export function getClientIP(request: any): string {
  // Vercel sets this header
  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fallback
  return request.headers?.get('x-real-ip') || '0.0.0.0';
}
