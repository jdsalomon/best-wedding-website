const express = require('express')
const router = express.Router()
const database = require('../utils/database')
const directImport = require('../utils/directImport')

// GET /api/guests - Get all guests
router.get('/', async (req, res) => {
  try {
    const guests = await database.getAllGuests()
    res.json({ success: true, data: guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    res.status(500).json({ success: false, message: 'Error fetching guests' })
  }
})

// GET /api/guests/search?q=query - Search guests
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' })
    }

    const guests = await database.searchGuests(query)
    res.json({ success: true, data: guests })
  } catch (error) {
    console.error('Error searching guests:', error)
    res.status(500).json({ success: false, message: 'Error searching guests' })
  }
})

// GET /api/guests/ungrouped - Get guests without groups
router.get('/ungrouped', async (req, res) => {
  try {
    const guests = await database.getUngroupedGuests()
    res.json({ success: true, data: guests })
  } catch (error) {
    console.error('Error fetching ungrouped guests:', error)
    res.status(500).json({ success: false, message: 'Error fetching ungrouped guests' })
  }
})

// GET /api/guests/suggested?lastName=name&source=source - Get suggested guests for grouping
router.get('/suggested', async (req, res) => {
  try {
    const { lastName, source } = req.query
    if (!lastName) {
      return res.status(400).json({ success: false, message: 'Last name required' })
    }

    const guests = await database.getSuggestedGuestsForGrouping(lastName, source)
    res.json({ success: true, data: guests })
  } catch (error) {
    console.error('Error fetching suggested guests:', error)
    res.status(500).json({ success: false, message: 'Error fetching suggested guests' })
  }
})

// GET /api/guests/:id - Get guest by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const guest = await database.getGuestById(id)
    
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' })
    }

    res.json({ success: true, data: guest })
  } catch (error) {
    console.error('Error fetching guest:', error)
    res.status(500).json({ success: false, message: 'Error fetching guest' })
  }
})

// POST /api/guests - Create new guest
router.post('/', async (req, res) => {
  try {
    const guestData = req.body
    
    // Validate required fields
    if (!guestData.first_name || !guestData.last_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name and last name are required' 
      })
    }

    const guest = await database.createGuest(guestData)
    res.status(201).json({ success: true, data: guest })
  } catch (error) {
    console.error('Error creating guest:', error)
    res.status(500).json({ success: false, message: 'Error creating guest' })
  }
})

// PUT /api/guests/:id - Update guest
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const guestData = req.body

    // Validate required fields
    if (!guestData.first_name || !guestData.last_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name and last name are required' 
      })
    }

    const guest = await database.updateGuest(id, guestData)
    res.json({ success: true, data: guest })
  } catch (error) {
    console.error('Error updating guest:', error)
    res.status(500).json({ success: false, message: 'Error updating guest' })
  }
})

// DELETE /api/guests/:id - Delete guest
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await database.deleteGuest(id)
    res.json({ success: true, message: 'Guest deleted successfully' })
  } catch (error) {
    console.error('Error deleting guest:', error)
    res.status(500).json({ success: false, message: 'Error deleting guest' })
  }
})

// POST /api/guests/import-csv - Direct CSV import to database
router.post('/import-csv', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      })
    }

    console.log(`📁 Starting direct CSV import: ${req.file.originalname}`)
    
    // Set up Server-Sent Events for progress
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    let results
    try {
      // Import with progress callback
      results = await directImport.importCSVDirectly(req.file.path, async (progress) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          ...progress 
        })}\n\n`)
      })
      
      // Send final results
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        results 
      })}\n\n`)
      
    } catch (error) {
      console.error('Import error:', error)
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message 
      })}\n\n`)
    }
    
    res.end()
    
  } catch (error) {
    console.error('Error in CSV import endpoint:', error)
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error processing CSV import: ' + error.message 
      })
    }
  }
})

// POST /api/guests/import-csv-simple - Simple CSV import (no streaming)
router.post('/import-csv-simple', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded' 
      })
    }

    console.log(`📁 Starting simple CSV import: ${req.file.originalname}`)
    
    const results = await directImport.importCSVDirectly(req.file.path)
    
    res.json({
      success: true,
      message: `Import complete: ${results.imported} guests imported, ${results.duplicates} duplicates skipped`,
      data: results
    })
    
  } catch (error) {
    console.error('Error in simple CSV import:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error processing CSV import: ' + error.message 
    })
  }
})

module.exports = router