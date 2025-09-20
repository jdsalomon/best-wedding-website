import { openrouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { SYSTEM_PROMPT, loadHyperpersonalizationTemplate } from '../../utils/loadPrompts'
import { parseSessionCookie } from '../../lib/authMiddleware'
import { getGroupContext, processHyperpersonalizationTemplate } from '../../utils/hyperpersonalization'
import { getClientId, checkRateLimit } from '../../lib/rateLimit'
import { createClient } from '@supabase/supabase-js'

// Model Fallback Configuration (max 3 models due to OpenRouter constraint)
// OpenRouter will automatically try each model in order if previous ones fail
const FALLBACK_MODELS = [
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet'
]

// Routing preference for OpenRouter
const ROUTING_PREFERENCE = 'quality'

// Initialize Supabase client for RSVP data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Get AI response using OpenRouter's native fallback system
 * OpenRouter automatically tries models in order if previous ones fail
 */
async function getAIResponseWithFallback(
  systemPrompt: string,
  limitedMessages: Message[],
  temperature: number = 0.7
) {
  console.log(`🤖 Using OpenRouter native fallback: ${FALLBACK_MODELS.join(' → ')}`)

  // Use OpenRouter's native fallback system via providerOptions
  const result = await streamText({
    model: openrouter(FALLBACK_MODELS[0]), // Primary model
    messages: [
      { role: 'system', content: systemPrompt },
      ...limitedMessages
    ],
    temperature,
    providerOptions: {
      openrouter: {
        models: FALLBACK_MODELS, // OpenRouter handles automatic fallback
      }
    },
    headers: {
      'X-OpenRouter-Prefer': ROUTING_PREFERENCE
    }
  })

  console.log(`✅ OpenRouter streaming with native fallback initialized`)
  return result
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
  
  for (let i = messages.length - 1; i >= 0 && exchangeCount < maxExchanges; i--) {
    const message = messages[i]
    recentMessages.unshift(message) // Add to beginning since we're working backwards
    
    // Count exchanges: when we see a user message (start of an exchange when working backwards)
    if (message.role === 'user') {
      exchangeCount++
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
  statusLines.push('Under your message, the user will have displayed a clickable table allowing it to respond to the events. Build a contextual response to introduce that table. \n ## Current RSVP Status Context')
  
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

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid request: messages array required' })
    }

    // Validate message limits
    if (messages.length > 20) {
      return res.status(400).json({ message: 'Too many messages in conversation history' })
    }

    // Validate message content length
    const totalLength = messages.reduce((sum: number, msg: Message) => sum + (msg.content?.length || 0), 0)
    if (totalLength > 10000) {
      return res.status(400).json({ message: 'Message content too long' })
    }

    // Check for individual message length
    const longMessage = messages.find((msg: Message) => msg.content && msg.content.length > 2000)
    if (longMessage) {
      return res.status(400).json({ message: 'Individual message too long (max 2000 characters)' })
    }

    // Rate limiting
    const session = parseSessionCookie(req.headers.cookie)
    const client = getClientId(req, session)
    const { success, limit, remaining, reset } = await checkRateLimit(client.id, client.type)
    
    if (!success) {
      const resetTime = new Date(reset).toISOString()
      return res.status(429).json({
        message: `Rate limit exceeded. Try again after ${resetTime}`,
        limit,
        remaining,
        reset: resetTime
      })
    }

    console.log(`🚦 Rate limit check passed: ${remaining}/${limit} remaining for ${client.type}:${client.id}`)

    // Get base system prompt
    let systemPrompt = SYSTEM_PROMPT

    // Try to add hyperpersonalization if user is authenticated
    try {
      
      if (session?.groupId) {
        console.log(`🎯 Generating hyperpersonalized prompt for group: ${session.groupName}`)
        
        const groupContext = await getGroupContext(session.groupId, session.currentUserId, session.userLanguage || session.groupLanguage)
        
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

    // Debug logging - API and request status
    console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Present' : 'Missing'}`)
    console.log(`📝 System prompt length: ${systemPrompt.length} chars`)
    console.log(`💬 Messages: ${limitedMessages.length} messages`)
    console.log(`🎯 Fallback Models: ${FALLBACK_MODELS.join(' → ')}`)
    console.log(`⚙️ Routing Preference: ${ROUTING_PREFERENCE}`)

    // Get AI response with OpenRouter native fallback
    const result = await getAIResponseWithFallback(
      systemPrompt,
      limitedMessages,
      0.7
    )

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
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    if (errorMessage.includes('All models failed')) {
      return res.status(503).json({ 
        message: 'All AI models are currently unavailable. Please try again later.',
        details: errorMessage
      })
    }
    
    return res.status(500).json({ message: 'Internal server error' })
  }
}