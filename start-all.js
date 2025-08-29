#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🎯 Starting Wedding Website & Admin Server...\n')

// Start the main website
const website = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: __dirname
})

// Start the admin server
const adminServer = spawn('npm', ['run', 'start'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: path.join(__dirname, 'admin-server')
})

// Handle website output
website.stdout.on('data', (data) => {
  process.stdout.write(`[Website] ${data}`)
})

website.stderr.on('data', (data) => {
  process.stderr.write(`[Website] ${data}`)
})

// Handle admin server output
adminServer.stdout.on('data', (data) => {
  process.stdout.write(`[Admin] ${data}`)
})

adminServer.stderr.on('data', (data) => {
  process.stderr.write(`[Admin] ${data}`)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down both servers...')
  website.kill('SIGINT')
  adminServer.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  website.kill('SIGTERM')
  adminServer.kill('SIGTERM')
  process.exit(0)
})

website.on('close', (code) => {
  console.log(`Website process exited with code ${code}`)
})

adminServer.on('close', (code) => {
  console.log(`Admin server process exited with code ${code}`)
})