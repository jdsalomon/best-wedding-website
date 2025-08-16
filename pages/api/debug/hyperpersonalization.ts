import type { NextApiRequest, NextApiResponse } from 'next'
import { parseSessionCookie } from '../../../lib/authMiddleware'
import { getGroupContext, generatePersonalizedPrompt } from '../../../utils/hyperpersonalization'

type DebugResponse = {
  success: boolean
  session?: {
    groupId: string
    groupName: string
  }
  groupContext?: any
  personalizedPrompt?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, error: 'Not found' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Parse session
    const session = parseSessionCookie(req.headers.cookie)
    
    if (!session?.groupId) {
      return res.status(200).json({
        success: false,
        error: 'No authenticated session found. Please login first.'
      })
    }

    // Get group context
    const groupContext = await getGroupContext(session.groupId)
    
    if (!groupContext) {
      return res.status(200).json({
        success: false,
        session: {
          groupId: session.groupId,
          groupName: session.groupName
        },
        error: 'Could not fetch group context'
      })
    }

    // Generate personalized prompt
    const personalizedPrompt = generatePersonalizedPrompt(groupContext)

    return res.status(200).json({
      success: true,
      session: {
        groupId: session.groupId,
        groupName: session.groupName
      },
      groupContext,
      personalizedPrompt
    })

  } catch (error) {
    console.error('Debug hyperpersonalization error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}