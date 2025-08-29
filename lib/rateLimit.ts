import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

// Create rate limiter instances
export const ipRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per IP
  analytics: true,
})

export const userRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute per authenticated user
  analytics: true,
})

// Get client identifier (IP or user ID)
export function getClientId(req: any, session: any): { id: string, type: 'ip' | 'user' } {
  if (session?.currentUserId) {
    return { id: session.currentUserId, type: 'user' }
  }
  
  // Get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']
  const ip = forwarded ? forwarded.split(',')[0] : realIP || req.connection.remoteAddress || 'unknown'
  
  return { id: ip, type: 'ip' }
}

// Apply appropriate rate limit
export async function checkRateLimit(clientId: string, type: 'ip' | 'user') {
  const limiter = type === 'user' ? userRateLimit : ipRateLimit
  return await limiter.limit(clientId)
}