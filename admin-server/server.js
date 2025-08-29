require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const { detect } = require('detect-port')

const guestRoutes = require('./routes/guests')
const groupRoutes = require('./routes/groups')
const groupingRoutes = require('./routes/grouping')
const eventRoutes = require('./routes/events')
const rsvpRoutes = require('./routes/rsvp')

const app = express()
const PREFERRED_PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'), false)
    }
  }
})

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')))

// API Routes
app.use('/api/guests', guestRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/grouping', groupingRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/rsvp', rsvpRoutes)

// CSV upload endpoint for direct import
app.post('/api/upload-csv', upload.single('csvFile'), async (req, res) => {
  // Forward to guests route for simple import (JSON response)
  req.url = '/import-csv-simple'
  req.method = 'POST'
  guestRoutes(req, res)
})

// Contact coverage endpoint
app.get('/api/contact-coverage', async (req, res) => {
  try {
    const database = require('./utils/database')
    const coverage = await database.getContactCoverage()
    res.json({ success: true, data: coverage })
  } catch (error) {
    console.error('Contact coverage error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching contact coverage'
    })
  }
})

// Import statistics endpoint
app.get('/api/import-stats', async (req, res) => {
  try {
    const directImport = require('./utils/directImport')
    const stats = await directImport.getImportStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Import stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching import statistics'
    })
  }
})

// Main admin page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin server is running' })
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    })
  }
  
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  })
})

// Start server with dynamic port detection
async function startServer() {
  try {
    const port = await detect(PREFERRED_PORT)
    app.listen(port, () => {
      console.log(`🔧 Wedding Admin Server running on http://localhost:${port}`)
      if (port !== PREFERRED_PORT) {
        console.log(`⚠️  Port ${PREFERRED_PORT} was taken, using port ${port} instead`)
      }
      console.log(`📊 Access the admin interface at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()