import type { NextApiRequest, NextApiResponse } from 'next'
import { parseSessionCookie } from '../../../lib/authMiddleware'
import { getGroupContext, processHyperpersonalizationTemplate } from '../../../utils/hyperpersonalization'
import { loadHyperpersonalizationTemplate } from '../../../utils/loadPrompts'

type DebugResponse = {
  success: boolean
  session?: {
    groupId: string
    groupName: string
    currentUserId?: string
    currentUserName?: string
  }
  groupContext?: any
  personalizedPrompt?: string
  templateContent?: string
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

    // Get group context with current user info
    const groupContext = await getGroupContext(session.groupId, session.currentUserId, session.userLanguage || session.groupLanguage)
    
    if (!groupContext) {
      return res.status(200).json({
        success: false,
        session: {
          groupId: session.groupId,
          groupName: session.groupName,
          currentUserId: session.currentUserId,
          currentUserName: session.currentUserName
        },
        error: 'Could not fetch group context'
      })
    }

    // Load and process hyperpersonalization template
    const template = loadHyperpersonalizationTemplate()
    const personalizedPrompt = template ? processHyperpersonalizationTemplate(template, groupContext) : 'Template not found'

    return res.status(200).json({
      success: true,
      session: {
        groupId: session.groupId,
        groupName: session.groupName,
        currentUserId: session.currentUserId,
        currentUserName: session.currentUserName
      },
      groupContext,
      templateContent: template || 'Template not loaded',
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