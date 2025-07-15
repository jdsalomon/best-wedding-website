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

  const dummyResponses = [
    "Thanks for your question! I'm here to help with anything about Estelle & Julien's wedding on Kea Island. Feel free to ask about transportation, hotels, or the program!",
    "Great question! For transportation to Kea Island, you'll need to fly to Athens (ATH) and then take a ferry from Lavrio Port. The ferry takes about 1.5 hours and costs €15-25 per person.",
    "Regarding hotels, I recommend checking out the accommodations on Kea Island. There are various options from luxury to budget-friendly. The island has beautiful locations near the wedding venues!",
    "The wedding program spans 4 amazing days! It includes the civil ceremony, Shabbat dinner, welcome events, the religious ceremony, and celebrations. Each day has special activities planned on this beautiful Greek island.",
    "For the wedding list, your presence is the most important gift! However, if you'd like to contribute, there are options for traditional registry items, honeymoon fund, or charitable donations."
  ]

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

    // Simulate AI thinking for 5 seconds
    setTimeout(() => {
      const randomResponse = dummyResponses[Math.floor(Math.random() * dummyResponses.length)]
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsThinking(false)
    }, 5000)
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