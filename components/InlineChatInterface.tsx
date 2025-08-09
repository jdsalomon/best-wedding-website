import { useState } from 'react'
import * as React from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { colors, typography, spacing, borderRadius } from '../styles/theme'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface InlineChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  firstMessage?: string
}

const InlineChatInterface = ({ isOpen, onClose, firstMessage }: InlineChatInterfaceProps) => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    try {
      // Call the real OpenAI API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: messageContent }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from chat API')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let assistantResponse = ''
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      // Add empty assistant message that we'll update as we stream
      setMessages(prev => [...prev, assistantMessage])
      setIsThinking(false)

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                assistantResponse += parsed.choices[0].delta.content
                // Update the assistant message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantResponse }
                    : msg
                ))
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calling chat API:', error)
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  // Handle first message when chat opens
  React.useEffect(() => {
    if (isOpen && firstMessage && messages.length === 0) {
      handleSendMessage(firstMessage)
    }
  }, [isOpen, firstMessage])

  if (!isOpen) return null

  return (
    <div style={{
      backgroundColor: colors.cream,
      border: `2px solid ${colors.oliveGreen}`,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xl,
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.oliveGreen,
        color: colors.cream,
        padding: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: typography.bold,
            fontFamily: typography.heading
          }}>
            🤖 {t('chat.title')}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            opacity: 0.9,
            fontFamily: typography.body
          }}>
            {t('chat.subtitle')}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.cream,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={t('chat.close')}
        >
          ×
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        padding: spacing.md,
        backgroundColor: colors.cream
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: colors.charcoal,
            opacity: 0.7,
            fontStyle: 'italic',
            margin: spacing.lg + ' 0',
            fontSize: '1rem',
            fontFamily: typography.body
          }}>
            {t('chat.subtitle')}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: spacing.md,
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: message.role === 'user' ? colors.oliveGreen : colors.warmBeige,
                color: message.role === 'user' ? colors.cream : colors.charcoal,
                fontSize: '0.95rem',
                fontFamily: typography.body,
                lineHeight: 1.4,
                textAlign: 'left'
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: spacing.md
          }}>
            <div style={{
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: colors.warmBeige,
              color: colors.charcoal,
              fontSize: '0.95rem',
              fontFamily: typography.body,
              fontStyle: 'italic',
              textAlign: 'left'
            }}>
              🤔 Thinking...
            </div>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div style={{
        padding: spacing.md,
        borderTop: `1px solid ${colors.oliveGreen}`,
        backgroundColor: colors.warmBeige
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          border: `1px solid ${colors.oliveGreen}`,
          borderRadius: borderRadius.md,
          backgroundColor: colors.cream,
          padding: spacing.sm
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '1rem',
              fontFamily: typography.body,
              color: colors.charcoal,
              resize: 'none' as const,
              minHeight: '24px',
              maxHeight: '120px',
              outline: 'none',
              padding: 0
            }}
            placeholder={t('chat.placeholder')}
            disabled={isThinking}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isThinking || !input.trim()}
            style={{
              backgroundColor: colors.oliveGreen,
              color: colors.cream,
              border: 'none',
              borderRadius: borderRadius.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              cursor: isThinking || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontFamily: typography.body,
              opacity: isThinking || !input.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap' as const,
              flexShrink: 0
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default InlineChatInterface