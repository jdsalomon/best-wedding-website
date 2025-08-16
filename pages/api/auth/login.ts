import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticateGroup } from '../../../lib/auth'
import { serialize } from 'cookie'

type LoginRequest = {
  password: string
}

type LoginResponse = {
  success: boolean
  message: string
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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
  }

  try {
    const { password }: LoginRequest = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      })
    }

    const authResult = await authenticateGroup(password.trim())

    if (!authResult.success || !authResult.group) {
      return res.status(401).json({
        success: false,
        message: authResult.error || 'Invalid credentials'
      })
    }

    // Create session cookie
    const sessionData = {
      groupId: authResult.group.id,
      groupName: authResult.group.name,
      loginTime: Date.now()
    }

    const sessionCookie = serialize('wedding-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })

    res.setHeader('Set-Cookie', sessionCookie)

    // Return sanitized guest data
    const sanitizedGuests = authResult.guests?.map(guest => ({
      id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      phone: guest.phone,
      email: guest.email
    })) || []

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      group: {
        id: authResult.group.id,
        name: authResult.group.name,
        guests: sanitizedGuests
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}