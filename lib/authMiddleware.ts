import type { NextApiRequest, NextApiResponse } from 'next'
import type { GetServerSidePropsContext } from 'next'

export type SessionData = {
  groupId: string
  groupName: string
  userLanguage?: string // Individual user's preferred language
  groupLanguage?: string // Deprecated: kept for backward compatibility
  currentUserId?: string
  currentUserName?: string
  loginTime: number
}

export function parseSessionCookie(cookieHeader: string | undefined): SessionData | null {
  if (!cookieHeader) return null
  
  try {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    const sessionValue = cookies['wedding-session']
    if (!sessionValue) return null
    
    const sessionData = JSON.parse(decodeURIComponent(sessionValue))
    
    // Check if session is expired (7 days)
    const sessionAge = Date.now() - sessionData.loginTime
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    if (sessionAge > maxAge) {
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('Error parsing session cookie:', error)
    return null
  }
}

// Middleware for API routes
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, session: SessionData) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = parseSessionCookie(req.headers.cookie)
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    return handler(req, res, session)
  }
}

// Server-side props authentication check
export function requireAuth(
  getServerSidePropsFunction?: (context: GetServerSidePropsContext, session: SessionData) => Promise<any>
) {
  return async (context: GetServerSidePropsContext) => {
    const session = parseSessionCookie(context.req.headers.cookie)
    
    if (!session) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }
    
    if (getServerSidePropsFunction) {
      return getServerSidePropsFunction(context, session)
    }
    
    return {
      props: {
        session
      }
    }
  }
}

// Client-side hook for authentication status
export function useAuth() {
  // This would need to be implemented with React context for client-side
  // For now, we'll handle auth checks server-side
  return null
}