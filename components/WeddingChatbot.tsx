import { useState } from 'react'
import { flushSync } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, spacing, borderRadius } from '../styles/theme'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WeddingChatbotProps {
  isOpen: boolean
  onClose: () => void
}

const WeddingChatbot = ({ isOpen, onClose }: WeddingChatbotProps) => {
  const { t } = useTranslation()
  const { language } = useLanguageContext()
  const { isAuthenticated, group } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const getPersonalizedTitle = () => {
    if (isAuthenticated && group) {
      return language === 'fr' ? `Bienvenue ${group.name} !` : `Welcome ${group.name}!`
    }
    return t('chat.title')
  }

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
                // Update the assistant message in real-time with flushSync for immediate UI updates
                flushSync(() => {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantResponse }
                      : msg
                  ))
                })
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

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: 'min(400px, calc(100vw - 40px))',
      height: 'min(600px, calc(100vh - 40px))',
      backgroundColor: colors.cream,
      borderRadius: borderRadius.lg,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      border: `2px solid ${colors.oliveGreen}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
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
            🤖 {getPersonalizedTitle()}
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
        >
          ×
        </button>
      </div>

      {/* Chat Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: spacing.md,
            backgroundColor: colors.cream
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: colors.charcoal,
                opacity: 0.7,
                fontStyle: 'italic',
                marginTop: spacing.lg
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
                    lineHeight: 1.4
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <span style={{margin: 0, lineHeight: 1.4}}>{children}</span>,
                      strong: ({children}) => <strong style={{color: message.role === 'user' ? colors.cream : colors.deepOlive}}>{children}</strong>,
                      em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
                      ul: ({children}) => <ul style={{margin: '0.5rem 0', paddingLeft: '1rem'}}>{children}</ul>,
                      ol: ({children}) => <ol style={{margin: '0.5rem 0', paddingLeft: '1rem'}}>{children}</ol>,
                      li: ({children}) => <li style={{marginBottom: '0.25rem'}}>{children}</li>,
                      a: ({href, children}) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: message.role === 'user' ? colors.cream : colors.deepOlive,
                            textDecoration: 'underline'
                          }}
                        >
                          {children}
                        </a>
                      ),
                      table: ({children}) => (
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          margin: '0.5rem 0',
                          fontSize: '0.9em',
                          border: `1px solid ${message.role === 'user' ? colors.cream : colors.oliveGreen}`
                        }}>
                          {children}
                        </table>
                      ),
                      thead: ({children}) => (
                        <thead style={{
                          backgroundColor: message.role === 'user' ? colors.deepOlive : colors.sageGreen
                        }}>
                          {children}
                        </thead>
                      ),
                      th: ({children}) => (
                        <th style={{
                          padding: '0.5rem',
                          textAlign: 'left',
                          fontWeight: typography.semibold,
                          color: message.role === 'user' ? colors.cream : colors.charcoal,
                          border: `1px solid ${message.role === 'user' ? colors.cream : colors.oliveGreen}`
                        }}>
                          {children}
                        </th>
                      ),
                      td: ({children}) => (
                        <td style={{
                          padding: '0.5rem',
                          border: `1px solid ${message.role === 'user' ? colors.cream : colors.oliveGreen}`,
                          color: message.role === 'user' ? colors.cream : colors.charcoal
                        }}>
                          {children}
                        </td>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
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
                  fontStyle: 'italic'
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
      </div>
    </div>
  )
}

// Chat Toggle Button Component
export const ChatToggleButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation()
  
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: colors.oliveGreen,
        color: colors.cream,
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.backgroundColor = colors.deepOlive
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.backgroundColor = colors.oliveGreen
      }}
      title={t('chat.openChat')}
    >
      💬
    </button>
  )
}

export default WeddingChatbot