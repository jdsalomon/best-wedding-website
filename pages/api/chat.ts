import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { SYSTEM_PROMPT, loadHyperpersonalizationTemplate } from '../../utils/loadPrompts'
import { parseSessionCookie } from '../../lib/authMiddleware'
import { getGroupContext, processHyperpersonalizationTemplate } from '../../utils/hyperpersonalization'

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

    // Set up Server-Sent Events streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`)
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