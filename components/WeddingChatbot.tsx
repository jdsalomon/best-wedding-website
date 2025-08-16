/**
 * @deprecated This component is deprecated. Use InlineChatInterface instead.
 * 
 * WeddingChatbot was the original chat component but has been replaced by 
 * InlineChatInterface which is now the active component used in the application.
 * 
 * All RSVP functionality has been ported to InlineChatInterface.
 * This component is kept for reference but should not be used.
 */

import { useState } from 'react'
import { flushSync } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, spacing, borderRadius } from '../styles/theme'
import RSVPTable from './RSVPTable'

interface RSVPData {
  events: Array<{
    id: string
    event_id: string
    name: string
    description?: string
    date: string
  }>
  guests: Array<{
    id: string
    first_name: string
    last_name: string
  }>
  responses: Record<string, Record<string, string>>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  rsvpData?: RSVPData
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

  const handleRSVPSubmission = async (responses: Array<{guestId: string, eventId: string, response: 'yes' | 'no' | 'no_answer'}>) => {
    try {
      const response = await fetch('/api/submit-rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit RSVP responses')
      }

      // Add a confirmation message to the chat
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Thank you! Your RSVP responses have been successfully registered. We've updated ${responses.length} response${responses.length !== 1 ? 's' : ''} for your group.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, confirmationMessage])
      
      console.log('✅ RSVP responses submitted successfully')
      
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      
      // Add an error message to the chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Sorry, there was an error submitting your RSVP responses. Please try again or contact us directly if the problem persists.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return

    // NUCLEAR DEBUG: Simple alert to verify JavaScript is running
    alert(`FRONTEND DEBUG: handleSendMessage called with: ${messageContent}`)

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
      console.log(`🚀 FRONTEND: Starting sendMessage with content: "${messageContent}"`)
      
      // Call the real OpenAI API endpoint
      console.log(`📡 FRONTEND: Making fetch request to /api/chat`)
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

      console.log(`📡 FRONTEND: Response received, status: ${response.status}, ok: ${response.ok}`)

      if (!response.ok) {
        throw new Error('Failed to get response from chat API')
      }

      // Check response type
      const contentType = response.headers.get('content-type')
      console.log(`🔍 FRONTEND: Raw Content-Type header: "${contentType}"`)
      console.log(`🔍 FRONTEND: Content-Type includes JSON check:`, contentType?.includes('application/json'))
      console.log(`🔍 FRONTEND: All response headers:`, Array.from(response.headers.entries()))

      // Handle JSON response (RSVP messages)
      if (contentType?.includes('application/json')) {
        console.log(`📄 FRONTEND: ENTERING JSON RESPONSE HANDLER`)
        try {
          console.log(`🔄 FRONTEND: About to call response.json()`)
          const jsonResponse = await response.json()
          console.log(`📋 FRONTEND: JSON parsing successful, response:`, jsonResponse)
          console.log(`📋 FRONTEND: Content field:`, jsonResponse.content)
          console.log(`📋 FRONTEND: RSVP data field:`, jsonResponse.rsvpData ? 'PRESENT' : 'MISSING')
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: jsonResponse.content || 'No content received',
            timestamp: new Date(),
            rsvpData: jsonResponse.rsvpData
          }
          
          console.log(`📅 FRONTEND: Assistant message created:`, {
            id: assistantMessage.id,
            role: assistantMessage.role,
            contentLength: assistantMessage.content.length,
            hasRsvpData: !!assistantMessage.rsvpData,
            eventsCount: assistantMessage.rsvpData?.events?.length || 0
          })
          
          console.log(`🔄 FRONTEND: About to update React state with setMessages`)
          setMessages(prev => {
            console.log(`🔄 FRONTEND: Inside setMessages callback, prev length:`, prev.length)
            const newMessages = [...prev, assistantMessage]
            console.log(`🔄 FRONTEND: New messages array length:`, newMessages.length)
            console.log(`🔄 FRONTEND: Last message:`, newMessages[newMessages.length - 1])
            return newMessages
          })
          
          console.log(`🔄 FRONTEND: Setting isThinking to false`)
          setIsThinking(false)
          console.log(`✅ FRONTEND: JSON message processing complete - returning`)
          return
        } catch (jsonError) {
          console.error(`❌ FRONTEND: Error in JSON processing:`, jsonError)
          console.error(`❌ FRONTEND: Error stack:`, jsonError instanceof Error ? jsonError.stack : 'No stack trace')
          
          // Add error message to UI and prevent fallthrough to streaming code
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Sorry, there was an error processing the RSVP data. Please try again.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          setIsThinking(false)
          return // CRITICAL: Prevent fallthrough to streaming code
        }
      } else {
        console.log(`🌊 FRONTEND: Content-Type is NOT JSON, using streaming path`)
      }

      // Handle streaming response (regular messages)
      console.log(`🌊 FRONTEND: Handling streaming response (regular message)`)
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let assistantResponse = ''
      let rsvpData: RSVPData | undefined = undefined
      
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
              
              // Handle content streaming (regular messages only)
              if (parsed.type === 'content' && parsed.choices?.[0]?.delta?.content) {
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
              
              // Handle legacy format (for backward compatibility)
              if (!parsed.type && parsed.choices?.[0]?.delta?.content) {
                assistantResponse += parsed.choices[0].delta.content
                flushSync(() => {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantResponse, rsvpData }
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
      console.error('❌ FRONTEND: Error calling chat API:', error)
      console.error('❌ FRONTEND: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
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
                  flexDirection: 'column',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Show RSVP Table above assistant messages that contain RSVP data */}
                {message.role === 'assistant' && message.rsvpData && (() => {
                  console.log('🎨 FRONTEND: Rendering RSVPTable component with data:', {
                    messageId: message.id,
                    hasRsvpData: !!message.rsvpData,
                    eventsCount: message.rsvpData.events?.length || 0,
                    guestsCount: message.rsvpData.guests?.length || 0
                  })
                  return (
                    <div style={{ width: '100%', marginBottom: spacing.sm }}>
                      <RSVPTable 
                        rsvpData={message.rsvpData}
                        onSubmit={handleRSVPSubmission}
                      />
                    </div>
                  )
                })()}
                {message.role === 'assistant' && !message.rsvpData && (() => {
                  console.log('❌ FRONTEND: Assistant message has no RSVP data:', { 
                    messageId: message.id, 
                    content: message.content.slice(0, 50) 
                  })
                  return null
                })()}

                <div
                  style={{
                    maxWidth: message.role === 'assistant' && message.rsvpData ? '100%' : '80%',
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