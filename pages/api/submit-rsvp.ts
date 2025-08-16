import { NextApiRequest, NextApiResponse } from 'next'
import { parseSessionCookie } from '../../lib/authMiddleware'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface RSVPResponse {
  guestId: string
  eventId: string
  response: 'yes' | 'no' | 'no_answer'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Parse session to get group info
    const session = parseSessionCookie(req.headers.cookie)
    
    if (!session?.groupId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      })
    }

    const { responses } = req.body as { responses: RSVPResponse[] }

    // Validate input
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Responses array is required and cannot be empty' 
      })
    }

    // Validate each response
    for (const response of responses) {
      if (!response.guestId || !response.eventId || !response.response) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each response must include guestId, eventId, and response' 
        })
      }
      
      if (!['yes', 'no', 'no_answer'].includes(response.response)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Response must be yes, no, or no_answer' 
        })
      }
    }

    // Verify all guests belong to the authenticated group
    const responseGuestIds = responses.map(r => r.guestId)
    const { data: groupGuests, error: groupError } = await supabase
      .from('guests')
      .select('id')
      .eq('group_id', session.groupId)

    if (groupError) {
      console.error('Error verifying group guests:', groupError)
      throw new Error('Database error verifying guests')
    }

    const groupGuestIds = groupGuests?.map(g => g.id) || []
    const invalidGuestIds = responseGuestIds.filter(id => !groupGuestIds.includes(id))
    
    if (invalidGuestIds.length > 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Some guests do not belong to your group' 
      })
    }

    // Verify all events exist
    const responseEventIds = Array.from(new Set(responses.map(r => r.eventId)))
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .in('id', responseEventIds)

    if (eventsError) {
      console.error('Error verifying events:', eventsError)
      throw new Error('Database error verifying events')
    }

    const validEventIds = events?.map(e => e.id) || []
    const invalidEventIds = responseEventIds.filter(id => !validEventIds.includes(id))
    
    if (invalidEventIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some events do not exist' 
      })
    }

    // Prepare upsert data
    const upsertData = responses.map(r => ({
      guest_id: r.guestId,
      event_id: r.eventId,
      response: r.response,
      notes: null // Could be extended later to include notes
    }))

    // Bulk upsert RSVP responses
    const { data, error } = await supabase
      .from('event_attendees')
      .upsert(upsertData, {
        onConflict: 'event_id,guest_id'
      })
      .select()

    if (error) {
      console.error('Error updating RSVP responses:', error)
      throw new Error('Database error updating responses')
    }

    console.log(`✅ Updated ${responses.length} RSVP responses for group: ${session.groupName}`)

    res.json({ 
      success: true, 
      data: data,
      message: `Successfully updated ${responses.length} RSVP responses`
    })

  } catch (error) {
    console.error('RSVP submission error:', error)
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}