const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { detect } = require('detect-port')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const PREFERRED_PORT = parseInt(process.env.PORT, 10) || 3000

const app = next({ dev, hostname, port: PREFERRED_PORT })
const handle = app.getRequestHandler()

async function startServer() {
  try {
    console.log('🚀 Preparing Next.js application...')
    await app.prepare()
    
    const port = await detect(PREFERRED_PORT)
    
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    }).listen(port, (err) => {
      if (err) throw err
      
      console.log(`💒 Wedding Website running on http://localhost:${port}`)
      if (port !== PREFERRED_PORT) {
        console.log(`⚠️  Port ${PREFERRED_PORT} was taken, using port ${port} instead`)
      }
      console.log(`🎯 Ready for development!`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()