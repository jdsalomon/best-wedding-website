import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { SYSTEM_PROMPT, loadHyperpersonalizationTemplate } from '../../utils/loadPrompts'
import { parseSessionCookie } from '../../lib/authMiddleware'
import { getGroupContext, processHyperpersonalizationTemplate } from '../../utils/hyperpersonalization'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for RSVP data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Limit conversation memory to the last N exchanges to prevent context overflow
 * An exchange is defined as one user message + one assistant response
 */
function limitConversationMemory(messages: Message[], maxExchanges: number = 5): Message[] {
  if (messages.length === 0) return messages
  
  // Work backwards through messages to preserve most recent exchanges
  const recentMessages: Message[] = []
  let exchangeCount = 0
  let expectingRole: 'assistant' | 'user' = 'assistant' // Work backwards, so we expect assistant first
  
  for (let i = messages.length - 1; i >= 0 && exchangeCount < maxExchanges; i--) {
    const message = messages[i]
    recentMessages.unshift(message) // Add to beginning since we're working backwards
    
    // Count exchanges: when we see a user message after an assistant message (or standalone)
    if (message.role === 'user') {
      exchangeCount++
      expectingRole = 'assistant'
    } else if (message.role === 'assistant') {
      expectingRole = 'user'
    }
  }
  
  console.log(`💾 Memory management: Keeping ${recentMessages.length} messages (${exchangeCount} exchanges) from ${messages.length} total`)
  
  return recentMessages
}

/**
 * Check if user message contains RSVP-related keywords
 */
function containsRSVPKeywords(message: string): boolean {
  const rsvpKeywords = ['rsvp', 'respond', 'attendance', 'attending', 'confirm attendance']
  const lowerMessage = message.toLowerCase()
  return rsvpKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Generate RSVP status summary from existing response data
 */
function generateRSVPStatusContext(rsvpData: any): string {
  if (!rsvpData || !rsvpData.events || !rsvpData.guests) {
    return ''
  }

  const statusLines: string[] = []
  statusLines.push('## Current RSVP Status Context')
  
  // Overall statistics
  const totalResponses = rsvpData.events.length * rsvpData.guests.length
  const completedResponses = rsvpData.events.reduce((total: number, event: any) => {
    return total + rsvpData.guests.filter((guest: any) => 
      rsvpData.responses[event.id]?.[guest.id] && 
      rsvpData.responses[event.id][guest.id] !== 'no_answer'
    ).length
  }, 0)
  
  const completionPercentage = Math.round((completedResponses / totalResponses) * 100)
  statusLines.push(`- **Overall Progress**: ${completedResponses}/${totalResponses} responses completed (${completionPercentage}%)`)
  
  // Per-event status
  statusLines.push('- **Event Status**:')
  rsvpData.events.forEach((event: any) => {
    const eventResponses = rsvpData.guests.filter((guest: any) => 
      rsvpData.responses[event.id]?.[guest.id] && 
      rsvpData.responses[event.id][guest.id] !== 'no_answer'
    ).length
    const going = rsvpData.guests.filter((guest: any) => 
      rsvpData.responses[event.id]?.[guest.id] === 'yes'
    ).length
    const notGoing = rsvpData.guests.filter((guest: any) => 
      rsvpData.responses[event.id]?.[guest.id] === 'no'
    ).length
    const pending = rsvpData.guests.length - eventResponses
    
    statusLines.push(`  - ${event.name}: ${eventResponses}/${rsvpData.guests.length} responded (${going} going, ${notGoing} not going, ${pending} pending)`)
  })
  
  // Individual guest status summary
  statusLines.push('- **Guest Status**:')
  rsvpData.guests.forEach((guest: any) => {
    const guestResponses = rsvpData.events.map((event: any) => 
      rsvpData.responses[event.id]?.[guest.id] || 'no_answer'
    )
    const completed = guestResponses.filter((r: string) => r !== 'no_answer').length
    const going = guestResponses.filter((r: string) => r === 'yes').length
    const notGoing = guestResponses.filter((r: string) => r === 'no').length
    const pending = guestResponses.filter((r: string) => r === 'no_answer').length
    
    let status = ''
    if (pending === 0) {
      status = going === rsvpData.events.length ? 'confirmed all events' : 
               notGoing === rsvpData.events.length ? 'declined all events' : 
               'partially confirmed'
    } else {
      status = `${pending} event${pending !== 1 ? 's' : ''} pending`
    }
    
    statusLines.push(`  - ${guest.first_name} ${guest.last_name}: ${status}`)
  })
  
  return statusLines.join('\n')
}

/**
 * Get RSVP data for a group (events and current responses)
 */
async function getGroupRSVPData(groupId: string) {
  try {
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (eventsError) throw eventsError

    // Get all guests in the group
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .eq('group_id', groupId)
      .order('last_name', { ascending: true })

    if (guestsError) throw guestsError

    // Get existing RSVP responses for this group
    const guestIds = guests.map(g => g.id)
    let responses: any[] = []
    
    if (guestIds.length > 0) {
      const { data: responseData, error: responsesError } = await supabase
        .from('event_attendees')
        .select('event_id, guest_id, response, notes')
        .in('guest_id', guestIds)

      if (responsesError) throw responsesError
      responses = responseData || []
    }

    // Build response matrix
    const rsvpData = {
      events: events || [],
      guests: guests || [],
      responses: {} as Record<string, Record<string, string>>
    }

    // Initialize all responses as 'no_answer'
    rsvpData.events.forEach(event => {
      rsvpData.responses[event.id] = {}
      rsvpData.guests.forEach(guest => {
        rsvpData.responses[event.id][guest.id] = 'no_answer'
      })
    })

    // Fill in actual responses
    responses.forEach(response => {
      rsvpData.responses[response.event_id][response.guest_id] = response.response
    })

    return rsvpData
  } catch (error) {
    console.error('Error getting group RSVP data:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { messages } = req.body

    // Get base system prompt
    let systemPrompt = SYSTEM_PROMPT

    // Try to add hyperpersonalization if user is authenticated
    try {
      const session = parseSessionCookie(req.headers.cookie)
      
      if (session?.groupId) {
        console.log(`🎯 Generating hyperpersonalized prompt for group: ${session.groupName}`)
        
        const groupContext = await getGroupContext(session.groupId)
        
        if (groupContext) {
          const hyperpersonalizationTemplate = loadHyperpersonalizationTemplate()
          if (hyperpersonalizationTemplate) {
            const personalizedContext = processHyperpersonalizationTemplate(hyperpersonalizationTemplate, groupContext)
            systemPrompt = `${SYSTEM_PROMPT}\n\n${personalizedContext}`
            
            console.log(`✅ Hyperpersonalization added for "${groupContext.groupName}" (${groupContext.guestCount} members)`)
          } else {
            console.log(`⚠️ Could not load hyperpersonalization template`)
          }
        } else {
          console.log(`⚠️ Could not fetch group context for group ID: ${session.groupId}`)
        }
      } else {
        console.log(`💬 Anonymous chat - using base system prompt`)
      }
    } catch (personalizationError) {
      console.error('Hyperpersonalization error (continuing with base prompt):', personalizationError)
      // Continue with base prompt if hyperpersonalization fails
    }

    // Apply conversation memory management to prevent context overflow
    const limitedMessages = limitConversationMemory(messages, 5)

    // Check for RSVP keywords in the latest user message
    let rsvpData = null
    let isRSVPMessage = false
    const latestUserMessage = limitedMessages.filter(m => m.role === 'user').slice(-1)[0]
    
    console.log(`🔍 DEBUG: Checking for RSVP keywords in message: "${latestUserMessage?.content || 'NO MESSAGE'}"`)
    
    if (latestUserMessage && containsRSVPKeywords(latestUserMessage.content)) {
      console.log(`🎯 RSVP KEYWORD DETECTED! Using simple JSON response mode`)
      isRSVPMessage = true
      
      try {
        const session = parseSessionCookie(req.headers.cookie)
        console.log(`🔐 DEBUG: Session parsed:`, {
          hasSession: !!session,
          groupId: session?.groupId || 'NONE',
          groupName: session?.groupName || 'NONE'
        })
        
        if (session?.groupId) {
          console.log(`🎯 Fetching RSVP data for group: ${session.groupName} (ID: ${session.groupId})`)
          rsvpData = await getGroupRSVPData(session.groupId)
          console.log(`✅ RSVP data loaded:`, {
            eventsCount: rsvpData.events.length,
            guestsCount: rsvpData.guests.length
          })
        } else {
          console.log(`❌ RSVP detected but no authenticated group found`)
        }
      } catch (rsvpError) {
        console.error('❌ Error fetching RSVP data:', rsvpError)
        // Continue without RSVP data if there's an error
      }
    } else {
      console.log(`➡️ No RSVP keywords detected - using streaming mode`)
    }

    // Add RSVP status context to system prompt if this is an RSVP message with data
    if (isRSVPMessage && rsvpData) {
      const rsvpStatusContext = generateRSVPStatusContext(rsvpData)
      if (rsvpStatusContext) {
        systemPrompt = `${systemPrompt}\n\n${rsvpStatusContext}`
        console.log(`✅ RSVP status context added to system prompt`)
      }
    }

    // Debug logging - log the complete system prompt being sent to AI
    console.log('\n' + '='.repeat(80))
    console.log('🤖 SYSTEM PROMPT BEING SENT TO AI:')
    console.log('='.repeat(80))
    console.log(systemPrompt)
    console.log('='.repeat(80))
    console.log(`💬 CONVERSATION MESSAGES (${limitedMessages.length} messages):`)
    console.log(limitedMessages.map((msg, i) => `${i+1}. ${msg.role}: ${msg.content.slice(0, 50)}...`).join('\n'))
    console.log('='.repeat(80) + '\n')

    const result = await streamText({
    model: openai('gpt-4o'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...limitedMessages
      ],
      temperature: 0.7,
      maxTokens: 1000
    })

    // Handle RSVP messages with simple JSON response
    if (isRSVPMessage) {
      console.log(`📤 RSVP MESSAGE: Generating complete response (no streaming)`)
      
      // Generate the complete AI response
      let fullContent = ''
      for await (const chunk of result.textStream) {
        fullContent += chunk
      }
      
      console.log(`✅ Complete AI response generated (${fullContent.length} chars)`)
      
      // Return simple JSON response
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      
      const response = {
        content: fullContent,
        rsvpData: rsvpData
      }
      
      console.log(`📦 Sending JSON response with RSVP data:`, {
        contentLength: fullContent.length,
        hasRsvpData: !!rsvpData,
        eventsCount: rsvpData?.events.length || 0
      })
      
      return res.status(200).json(response)
    }

    // Handle regular messages with streaming (unchanged)
    console.log(`📤 REGULAR MESSAGE: Using streaming response`)
    
    // Set up Server-Sent Events streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Stream AI response (regular messages)
    for await (const chunk of result.textStream) {
      const payload = { 
        choices: [{ delta: { content: chunk } }],
        type: 'content' 
      }
      
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
      // Force flush for real-time streaming
      if ('flush' in res && typeof res.flush === 'function') res.flush()
    }
    
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}