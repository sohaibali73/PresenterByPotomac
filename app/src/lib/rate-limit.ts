/**
 * Rate Limiting Middleware for Potomac Presenter
 * 
 * Simple in-memory rate limiting for API routes.
 * For production, consider using Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (identifier: string) => string;
}

// In-memory store (resets on server restart)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * Check rate limit for an identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
  
  let entry = store.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    store.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  store.set(key, entry);
  
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for an identifier
 */
export function clearRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI generation endpoints - more restrictive
  ai: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requests per minute
  },
  
  // Export endpoints - moderate
  export: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 20,          // 20 exports per minute
  },
  
  // General API - less restrictive
  general: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
  },
  
  // Auth endpoints - very restrictive
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 attempts per 15 minutes
  },
} as const;

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (req: Request, ...args: any[]) => Promise<Response>,
  config: RateLimitConfig,
  getIdentifier: (req: Request) => string = (req) => {
    // Try to get IP from headers (for proxied requests)
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    // Fallback to a default identifier
    return 'anonymous';
  }
) {
  return async (req: Request, ...args: any[]) => {
    const identifier = getIdentifier(req);
    const result = checkRateLimit(identifier, config);
    
    // Add rate limit headers to all responses
    const headers = getRateLimitHeaders(config.maxRequests, result.remaining, result.resetTime);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
            ...headers,
          },
        }
      );
    }
    
    // Call the original handler
    const response = await handler(req, ...args);
    
    // Add rate limit headers to the response
    if (response instanceof Response) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

export default checkRateLimit;