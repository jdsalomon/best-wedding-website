import type { NextApiRequest, NextApiResponse } from 'next'
import { parseSessionCookie } from '../../../lib/authMiddleware'
import { getGroupGuests } from '../../../lib/auth'

type StatusResponse = {
  isAuthenticated: boolean
  group?: {
    id: string
    name: string
    guests: Array<{
      id: string
      first_name: string
      last_name: string
      phone?: string
      email?: string
    }>
  }
  session?: {
    groupId: string
    groupName: string
    userLanguage?: string
    groupLanguage?: string // Deprecated: kept for backward compatibility
    currentUserId?: string
    currentUserName?: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ isAuthenticated: false })
  }

  try {
    const session = parseSessionCookie(req.headers.cookie)
    
    if (!session) {
      return res.status(200).json({ isAuthenticated: false })
    }

    // Get current group guests
    const guests = await getGroupGuests(session.groupId)
    
    const sanitizedGuests = guests.map(guest => ({
      id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      phone: guest.phone,
      email: guest.email
    }))

    return res.status(200).json({
      isAuthenticated: true,
      group: {
        id: session.groupId,
        name: session.groupName,
        guests: sanitizedGuests
      },
      session: {
        groupId: session.groupId,
        groupName: session.groupName,
        userLanguage: session.userLanguage || session.groupLanguage, // New field with fallback
        groupLanguage: session.groupLanguage || session.userLanguage, // Deprecated: backward compatibility
        currentUserId: session.currentUserId,
        currentUserName: session.currentUserName
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return res.status(200).json({ isAuthenticated: false })
  }
}