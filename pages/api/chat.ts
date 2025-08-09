import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { messages } = req.body

    // Wedding-specific system prompt
    const systemPrompt = `You are a helpful wedding assistant for Estelle and Julien's wedding on Kea Island, Greece on June 15, 2024. 

    WEDDING DETAILS:
    - Couple: Estelle & Julien
    - Date: June 15, 2024  
    - Location: Kea Island (Tzia), Greece - specifically Vourkari Village
    - 4-day celebration from June 13-16, 2024

    TRANSPORTATION:
    - Most guests fly to Athens (ATH) then take ferry to Kea
    - Ferry departs from Rafina port (45 minutes from Athens airport)
    - Multiple ferry companies: SeaJets, Blue Star Ferries
    - Wedding shuttle service available from Korissia port to venue

    ACCOMMODATIONS:
    - Recommended hotel: Lorem Palace (walking distance to venue)
    - Mid-range options: Hotel des Lorem, Best Western
    - Budget options: Ibis, Airbnb rentals
    - Book early as Kea has limited capacity

    PROGRAM:
    - Day 1 (June 13): Civil ceremony + Shabbat dinner
    - Day 2 (June 14): Relaxation + Welcome party
    - Day 3 (June 15): Wedding ceremony + Reception
    - Day 4 (June 16): Beach day + Cinema night

    WEDDING LIST:
    - Traditional registry at Lorem Sonoma and Lorem Barn
    - Honeymoon fund for Greece island exploration
    - Charity donation options available

    Be helpful, warm, and provide specific details about the wedding. If asked about transportation, refer to the transportation matrix on the website for detailed flight and ferry options. Always be encouraging about the beautiful Greek island setting!`

    const result = await streamText({
      model: openai('gpt-4o-mini'),
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