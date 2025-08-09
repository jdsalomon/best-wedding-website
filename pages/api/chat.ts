import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { SYSTEM_PROMPT } from '../../utils/loadPrompts'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { messages } = req.body

    // Use pre-loaded system prompt (loaded at server startup)
    const systemPrompt = SYSTEM_PROMPT

    const result = await streamText({
    model: openai('gpt-4o'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
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