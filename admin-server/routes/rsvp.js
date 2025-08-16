const express = require('express')
const router = express.Router()
const database = require('../utils/database')

// GET /api/rsvp/group/:groupId - Get RSVP status for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params
    
    // Validate group exists
    const group = await database.getGroupById(groupId)
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      })
    }

    const rsvpData = await database.getGroupRSVPStatus(groupId)
    res.json({ success: true, data: rsvpData })
  } catch (error) {
    console.error('Error fetching group RSVP status:', error)
    res.status(500).json({ success: false, message: 'Error fetching RSVP status' })
  }
})

// POST /api/rsvp/batch - Submit multiple RSVP responses
router.post('/batch', async (req, res) => {
  try {
    const { responses, groupId } = req.body
    
    // Validate input
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Responses array is required and cannot be empty' 
      })
    }

    if (!groupId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID is required' 
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

    // Verify all guests belong to the specified group
    const { data: groupGuests, error: groupError } = await database.supabase
      .from('guests')
      .select('id')
      .eq('group_id', groupId)

    if (groupError) throw groupError

    const groupGuestIds = groupGuests.map(g => g.id)
    const responseGuestIds = responses.map(r => r.guestId)
    
    const invalidGuestIds = responseGuestIds.filter(id => !groupGuestIds.includes(id))
    if (invalidGuestIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some guests do not belong to the specified group' 
      })
    }

    // Update RSVPs
    const result = await database.bulkUpdateRSVPs(responses)
    
    res.json({ 
      success: true, 
      data: result,
      message: `Updated ${result.length} RSVP responses`
    })
  } catch (error) {
    console.error('Error updating bulk RSVPs:', error)
    res.status(500).json({ success: false, message: 'Error updating RSVP responses' })
  }
})

// PUT /api/rsvp/guest/:guestId/event/:eventId - Update single guest RSVP
router.put('/guest/:guestId/event/:eventId', async (req, res) => {
  try {
    const { guestId, eventId } = req.params
    const { response, notes, groupId } = req.body
    
    // Validate response
    if (!response || !['yes', 'no', 'no_answer'].includes(response)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid response (yes, no, no_answer) is required' 
      })
    }

    // Optional: Verify guest belongs to specified group
    if (groupId) {
      const { data: guest, error: guestError } = await database.supabase
        .from('guests')
        .select('group_id')
        .eq('id', guestId)
        .single()

      if (guestError) throw guestError

      if (guest.group_id !== groupId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Guest does not belong to specified group' 
        })
      }
    }

    const result = await database.updateGuestRSVP(guestId, eventId, response, notes)
    
    res.json({ 
      success: true, 
      data: result,
      message: 'RSVP response updated successfully'
    })
  } catch (error) {
    console.error('Error updating single RSVP:', error)
    res.status(500).json({ success: false, message: 'Error updating RSVP response' })
  }
})

// GET /api/rsvp/event/:eventId/summary - Get RSVP summary for an event
router.get('/event/:eventId/summary', async (req, res) => {
  try {
    const { eventId } = req.params
    
    // Get event details
    const event = await database.getEventById(eventId)
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    // Get attendees
    const attendees = await database.getEventAttendees(eventId)
    
    // Calculate summary statistics
    const summary = {
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      totalResponses: attendees.length,
      yes: attendees.filter(a => a.response === 'yes').length,
      no: attendees.filter(a => a.response === 'no').length,
      no_answer: attendees.filter(a => a.response === 'no_answer').length
    }
    
    // Calculate percentages
    if (summary.totalResponses > 0) {
      summary.percentages = {
        yes: Math.round((summary.yes / summary.totalResponses) * 100),
        no: Math.round((summary.no / summary.totalResponses) * 100),
        no_answer: Math.round((summary.no_answer / summary.totalResponses) * 100)
      }
    } else {
      summary.percentages = { yes: 0, no: 0, no_answer: 0 }
    }
    
    res.json({ 
      success: true, 
      data: {
        summary,
        attendees: attendees.map(a => ({
          id: a.id,
          response: a.response,
          notes: a.notes,
          guest: {
            firstName: a.guests.first_name,
            lastName: a.guests.last_name,
            email: a.guests.email,
            group: a.guests.groups?.name
          }
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching event RSVP summary:', error)
    res.status(500).json({ success: false, message: 'Error fetching RSVP summary' })
  }
})

// DELETE /api/rsvp/guest/:guestId/event/:eventId - Remove RSVP response
router.delete('/guest/:guestId/event/:eventId', async (req, res) => {
  try {
    const { guestId, eventId } = req.params
    const { groupId } = req.body
    
    // Optional: Verify guest belongs to specified group
    if (groupId) {
      const { data: guest, error: guestError } = await database.supabase
        .from('guests')
        .select('group_id')
        .eq('id', guestId)
        .single()

      if (guestError) throw guestError

      if (guest.group_id !== groupId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Guest does not belong to specified group' 
        })
      }
    }

    const { error } = await database.supabase
      .from('event_attendees')
      .delete()
      .eq('guest_id', guestId)
      .eq('event_id', eventId)

    if (error) throw error
    
    res.json({ 
      success: true, 
      message: 'RSVP response removed successfully'
    })
  } catch (error) {
    console.error('Error removing RSVP response:', error)
    res.status(500).json({ success: false, message: 'Error removing RSVP response' })
  }
})

module.exports = router