import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory fixed-window rate limiter per IP+path.
// Note: Works per runtime instance; for production-grade limits use a shared store (e.g., Upstash Redis).
type Bucket = { count: number; reset: number };
const WINDOW_SEC = 60;
const LIMIT = process.env.NODE_ENV === 'development' ? 120 : 60; // generous locally

// Use a global map so it can persist across requests in the same instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = globalThis as any;
const buckets: Map<string, Bucket> = globalAny.__rateBuckets || new Map();
globalAny.__rateBuckets = buckets;

function getIP(req: NextRequest): string {
  // Prefer platform-provided ip; fallback to headers
  const ip = (req as any).ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ip || '127.0.0.1';
}

function rateLimitKey(ip: string, path: string) {
  return `${ip}|${path}`;
}

function checkRateLimit(req: NextRequest): { allowed: boolean; headers: Record<string, string> } {
  const ip = getIP(req);
  const path = req.nextUrl.pathname;
  const key = rateLimitKey(ip, path);
  const now = Math.floor(Date.now() / 1000);
  let b = buckets.get(key);
  if (!b || now >= b.reset) {
    b = { count: 0, reset: now + WINDOW_SEC };
    buckets.set(key, b);
  }
  b.count += 1;
  const remaining = Math.max(0, LIMIT - b.count);
  const headers = {
    'X-RateLimit-Limit': String(LIMIT),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(b.reset),
  };
  return { allowed: b.count <= LIMIT, headers };
}

export function middleware(req: NextRequest) {
  // Restrict methods for specific API routes
  const path = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  // Only allow POST for these endpoints
  if ((path === '/api/embed' || path === '/api/rag/search' || path === '/api/utter' || path === '/api/intent') && method !== 'POST') {
    const res = NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    res.headers.set('Allow', 'POST');
    return res;
  }

  // For POST endpoints, ensure JSON Content-Type
  if ((path === '/api/embed' || path === '/api/rag/search' || path === '/api/utter' || path === '/api/intent') && method === 'POST') {
    const ct = req.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
    }
  }

  // Apply rate limit (POST endpoints) and light limit on GET test/count
  if (path === '/api/embed' || path === '/api/rag/search' || path === '/api/utter' || path === '/api/intent' || path === '/api/rag/test' || path === '/api/rag/count') {
    const { allowed, headers } = checkRateLimit(req);
    if (!allowed) {
      const res = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
      Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      // Advise when to retry in seconds
      const retryAfter = Math.max(1, Number(headers['X-RateLimit-Reset']) - Math.floor(Date.now() / 1000));
      res.headers.set('Retry-After', String(retryAfter));
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/embed', '/api/rag/search', '/api/utter', '/api/intent', '/api/rag/test', '/api/rag/count'],
};
