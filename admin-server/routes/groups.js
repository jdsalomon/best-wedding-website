const express = require('express')
const router = express.Router()
const database = require('../utils/database')

// GET /api/groups - Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await database.getAllGroups()
    res.json({ success: true, data: groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ success: false, message: 'Error fetching groups' })
  }
})

// GET /api/groups/:id - Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const group = await database.getGroupById(id)
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    res.json({ success: true, data: group })
  } catch (error) {
    console.error('Error fetching group:', error)
    res.status(500).json({ success: false, message: 'Error fetching group' })
  }
})

// POST /api/groups - Create new group
router.post('/', async (req, res) => {
  try {
    const groupData = req.body
    
    // Validate required fields
    if (!groupData.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name is required' 
      })
    }

    // Generate password if not provided
    if (!groupData.password) {
      groupData.password = database.generatePassword(groupData.name)
    }

    const group = await database.createGroup(groupData)
    res.status(201).json({ success: true, data: group })
  } catch (error) {
    console.error('Error creating group:', error)
    
    // Handle unique constraint error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name already exists' 
      })
    }
    
    res.status(500).json({ success: false, message: 'Error creating group' })
  }
})

// PUT /api/groups/:id - Update group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const groupData = req.body

    // Validate required fields
    if (!groupData.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name is required' 
      })
    }

    const group = await database.updateGroup(id, groupData)
    res.json({ success: true, data: group })
  } catch (error) {
    console.error('Error updating group:', error)
    
    // Handle unique constraint error
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name already exists' 
      })
    }
    
    res.status(500).json({ success: false, message: 'Error updating group' })
  }
})

// DELETE /api/groups/:id - Delete group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await database.deleteGroup(id)
    res.json({ success: true, message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    res.status(500).json({ success: false, message: 'Error deleting group' })
  }
})

// POST /api/groups/:id/assign-guests - Assign guests to group
router.post('/:id/assign-guests', async (req, res) => {
  try {
    const { id: groupId } = req.params
    const { guestIds } = req.body

    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest IDs array is required' 
      })
    }

    const guests = await database.assignGuestsToGroup(guestIds, groupId)
    res.json({ 
      success: true, 
      data: guests,
      message: `${guests.length} guests assigned to group`
    })
  } catch (error) {
    console.error('Error assigning guests to group:', error)
    res.status(500).json({ success: false, message: 'Error assigning guests to group' })
  }
})

// POST /api/groups/generate-password - Generate password for group name
router.post('/generate-password', (req, res) => {
  try {
    const { name } = req.body
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name is required' 
      })
    }

    const password = database.generatePassword(name)
    res.json({ success: true, data: { password } })
  } catch (error) {
    console.error('Error generating password:', error)
    res.status(500).json({ success: false, message: 'Error generating password' })
  }
})

// GET /api/groups/:id/contact - Get group contact information
router.get('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params
    const contactInfo = await database.getGroupContactInfo(id)
    res.json({ success: true, data: contactInfo })
  } catch (error) {
    console.error('Error fetching group contact info:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching group contact information' 
    })
  }
})

// PUT /api/groups/:id/contact - Update group contact information  
router.put('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params
    const { phone, email, address } = req.body
    
    const result = await database.updateGroupContact(id, { phone, email, address })
    
    res.json({ 
      success: true, 
      data: result,
      message: `Contact updated for ${result.principal.first_name} ${result.principal.last_name}`
    })
  } catch (error) {
    console.error('Error updating group contact:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error updating group contact information' 
    })
  }
})

// PUT /api/groups/:id/language - Bulk update language for all guests in group
router.put('/:id/language', async (req, res) => {
  try {
    const { id } = req.params
    const { language } = req.body
    
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Language is required and must be a string' 
      })
    }

    const result = await database.updateGroupLanguage(id, language)
    
    res.json({ 
      success: true, 
      data: result,
      message: `Language updated to "${language}" for ${result.count} guest${result.count !== 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Error updating group language:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error updating group language preference' 
    })
  }
})

module.exports = router