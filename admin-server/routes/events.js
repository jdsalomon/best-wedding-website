const express = require('express')
const router = express.Router()
const database = require('../utils/database')

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await database.getAllEvents()
    res.json({ success: true, data: events })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ success: false, message: 'Error fetching events' })
  }
})

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const event = await database.getEventById(id)
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' })
    }

    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ success: false, message: 'Error fetching event' })
  }
})

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const eventData = req.body
    
    // Validate required fields
    if (!eventData.event_id || !eventData.name || !eventData.date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID, name, and date are required' 
      })
    }

    // Validate date format
    const eventDate = new Date(eventData.date)
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      })
    }

    // Validate event_id format (letters, numbers, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(eventData.event_id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID can only contain letters, numbers, hyphens, and underscores' 
      })
    }

    const event = await database.createEvent(eventData)
    res.status(201).json({ success: true, data: event })
  } catch (error) {
    console.error('Error creating event:', error)
    
    // Handle unique constraint error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        success: false, 
        message: 'An event with this ID already exists' 
      })
    }
    
    res.status(500).json({ success: false, message: 'Error creating event' })
  }
})

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const eventData = req.body

    // Validate required fields
    if (!eventData.event_id || !eventData.name || !eventData.date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID, name, and date are required' 
      })
    }

    // Validate date format
    const eventDate = new Date(eventData.date)
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      })
    }

    // Validate event_id format
    if (!/^[a-zA-Z0-9_-]+$/.test(eventData.event_id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID can only contain letters, numbers, hyphens, and underscores' 
      })
    }

    const event = await database.updateEvent(id, eventData)
    res.json({ success: true, data: event })
  } catch (error) {
    console.error('Error updating event:', error)
    
    // Handle unique constraint error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        success: false, 
        message: 'An event with this ID already exists' 
      })
    }
    
    res.status(500).json({ success: false, message: 'Error updating event' })
  }
})

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await database.deleteEvent(id)
    res.json({ success: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ success: false, message: 'Error deleting event' })
  }
})

// GET /api/events/:id/attendees - Get attendees for an event
router.get('/:id/attendees', async (req, res) => {
  try {
    const { id } = req.params
    const attendees = await database.getEventAttendees(id)

    // Get total number of guests to calculate correct no-response count
    const allGuests = await database.getAllGuests()
    const totalGuests = allGuests.length

    // Calculate actual response counts
    const yesCount = attendees.filter(a => a.response === 'yes').length
    const noCount = attendees.filter(a => a.response === 'no').length

    // Calculate no response as: total guests - (yes + no responses)
    const noResponseCount = totalGuests - (yesCount + noCount)

    const summary = {
      total: totalGuests,
      yes: yesCount,
      no: noCount,
      no_answer: noResponseCount
    }

    res.json({
      success: true,
      data: {
        attendees: attendees,
        summary: summary
      }
    })
  } catch (error) {
    console.error('Error fetching event attendees:', error)
    res.status(500).json({ success: false, message: 'Error fetching event attendees' })
  }
})

module.exports = router