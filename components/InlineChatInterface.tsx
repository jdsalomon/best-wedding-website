import { useState, useRef, useEffect } from 'react'
import * as React from 'react'
import { flushSync } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, spacing, borderRadius } from '../styles/theme'
import RSVPTable from './RSVPTable'
import { getRandomFAQPrompts, FAQPrompt } from '../utils/faqPrompts'

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

interface InlineChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  firstMessage?: string
}

const InlineChatInterface = ({ isOpen, onClose, firstMessage }: InlineChatInterfaceProps) => {
  const { t } = useTranslation()
  const { language } = useLanguageContext()
  const { isAuthenticated, group } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [showFAQButtons, setShowFAQButtons] = useState(true)
  const [faqPrompts, setFaqPrompts] = useState<FAQPrompt[]>([])
  const [isClient, setIsClient] = useState(false)

  const getPersonalizedTitle = () => {
    if (isAuthenticated && group) {
      return language === 'fr' ? `Bienvenue ${group.name} !` : `Welcome ${group.name}!`
    }
    return t('chat.title')
  }
  
  // Auto-scroll refs and state
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Check if user is near bottom of chat
  const isNearBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return true
    
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < 100 // Within 100px of bottom
  }

  // Handle user scrolling
  const handleScroll = () => {
    setShouldAutoScroll(isNearBottom())
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFAQClick = (prompt: FAQPrompt) => {
    const message = t(prompt.messageKey)
    setShowFAQButtons(false)
    handleSendMessage(message)
  }

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return

    // Hide FAQ buttons once user starts chatting
    if (showFAQButtons) {
      setShowFAQButtons(false)
    }

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
    
    // Always scroll when user sends a message
    setShouldAutoScroll(true)
    setTimeout(() => scrollToBottom(), 0)

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

      // Check response type for hybrid handling
      const contentType = response.headers.get('content-type')
      console.log(`🔍 FRONTEND: Response Content-Type: ${contentType}`)

      // Handle JSON response (RSVP messages)
      if (contentType?.includes('application/json')) {
        console.log(`📄 FRONTEND: Handling JSON response (RSVP message)`)
        try {
          const jsonResponse = await response.json()
          console.log(`📋 FRONTEND: JSON response received:`, {
            contentLength: jsonResponse.content?.length || 0,
            hasRsvpData: !!jsonResponse.rsvpData
          })
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: jsonResponse.content || 'No content received',
            timestamp: new Date(),
            rsvpData: jsonResponse.rsvpData
          }
          
          setMessages(prev => [...prev, assistantMessage])
          setIsThinking(false)
          
          // Always scroll when new message is added
          setShouldAutoScroll(true)
          setTimeout(() => scrollToBottom(), 0)
          
          console.log(`✅ FRONTEND: JSON message processing complete`)
          return
        } catch (jsonError) {
          console.error(`❌ FRONTEND: Error processing JSON response:`, jsonError)
          
          // Add error message to UI
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Sorry, there was an error processing the RSVP data. Please try again.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          setIsThinking(false)
          return
        }
      }

      // Handle streaming response (regular messages)
      console.log(`🌊 FRONTEND: Handling streaming response (regular message)`)
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

  const handleRSVPSubmission = async (responses: Array<{ guestId: string; eventId: string; response: string }>) => {
    try {
      console.log('📝 RSVP submission started:', responses)
      
      const response = await fetch('/api/submit-rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ RSVP responses submitted successfully')
        
        // Add success message to chat
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Thank you! Your RSVP responses have been successfully registered. We look forward to celebrating with you! 🎉',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        // Always scroll when new message is added
        setShouldAutoScroll(true)
        setTimeout(() => scrollToBottom(), 0)
      } else {
        throw new Error(result.message || 'Failed to submit RSVP responses')
      }
      
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      
      // Add an error message to the chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Sorry, there was an error submitting your RSVP responses. Please try again or contact us directly.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Auto-scroll when messages change (if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
  }, [messages, shouldAutoScroll])

  // Handle first message when chat opens
  React.useEffect(() => {
    if (isOpen && firstMessage && messages.length === 0) {
      handleSendMessage(firstMessage)
    }
  }, [isOpen, firstMessage])

  // Initialize FAQ prompts on client side only to avoid hydration errors
  React.useEffect(() => {
    setIsClient(true)
    setFaqPrompts(getRandomFAQPrompts())
  }, [])

  if (!isOpen) return null

  // Additional auth guard - should not happen with home page guard, but safety first
  if (!isAuthenticated) {
    return (
      <div style={{
        backgroundColor: colors.cream,
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl
      }}>
        <div style={{
          textAlign: 'center',
          color: colors.charcoal,
          fontFamily: typography.body
        }}>
          <p>Accès non autorisé. Veuillez vous connecter.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: colors.cream,
      height: '100%',
      minHeight: '0', /* Allow flex shrinking */
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      border: 'none',
      borderRadius: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.oliveGreen,
        color: colors.cream,
        padding: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: typography.bold,
            fontFamily: typography.heading
          }}>
{getPersonalizedTitle()}
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
        {/* Close button hidden for main interface */}
        <div style={{ display: 'none' }}>
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
      </div>

      {/* Messages Area - Takes remaining space */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.md,
          backgroundColor: colors.cream
        }}
      >
        {messages.length === 0 && showFAQButtons && isClient && faqPrompts.length > 0 && (
          <>
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
            
            {/* FAQ Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              maxWidth: '400px',
              margin: `${spacing.lg} auto`,
              padding: '0 ' + spacing.md
            }}>
              {faqPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleFAQClick(prompt)}
                  style={{
                    backgroundColor: colors.warmBeige,
                    border: `1px solid ${colors.oliveGreen}`,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    fontSize: '0.95rem',
                    fontFamily: typography.body,
                    color: colors.charcoal,
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sageGreen
                    e.currentTarget.style.color = colors.cream
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.1)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.warmBeige
                    e.currentTarget.style.color = colors.charcoal
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {t(prompt.titleKey)}
                </button>
              ))}
            </div>
          </>
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
            <div
              style={{
                maxWidth: message.role === 'assistant' && message.rsvpData ? '100%' : '80%',
                padding: message.role === 'assistant' && message.rsvpData ? 0 : spacing.sm, // No padding for RSVP messages
                borderRadius: borderRadius.md,
                backgroundColor: message.role === 'user' ? colors.oliveGreen : colors.warmBeige,
                color: message.role === 'user' ? colors.cream : colors.charcoal,
                fontSize: '0.95rem',
                fontFamily: typography.body,
                lineHeight: 1.4,
                textAlign: 'left',
                overflow: 'hidden' // Ensure content stays within bubble
              }}
            >
              {/* AI Text Response */}
              {message.content && (
                <div style={{
                  padding: message.role === 'assistant' && message.rsvpData ? spacing.sm : 0,
                  paddingBottom: message.role === 'assistant' && message.rsvpData ? spacing.xs : 0
                }}>
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
              )}

              {/* RSVP Table - Integrated within the same message bubble */}
              {message.role === 'assistant' && message.rsvpData && (() => {
                console.log('🎨 FRONTEND: Rendering RSVPTable component with data:', {
                  messageId: message.id,
                  hasRsvpData: !!message.rsvpData,
                  eventsCount: message.rsvpData.events?.length || 0,
                  guestsCount: message.rsvpData.guests?.length || 0
                })
                return (
                  <div style={{ 
                    marginTop: message.content ? spacing.sm : 0 // Add spacing if there's text above
                  }}>
                    <RSVPTable 
                      rsvpData={message.rsvpData}
                      onSubmit={handleRSVPSubmission}
                    />
                  </div>
                )
              })()}
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
              fontSize: '1.2rem',
              fontFamily: typography.body,
              textAlign: 'left'
            }}>
              <span style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                <span style={{
                  animation: 'wave 1.4s infinite',
                  display: 'inline-block',
                  fontSize: '1.8rem',
                  animationDelay: '0s'
                }}>•</span>
                <span style={{
                  animation: 'wave 1.4s infinite',
                  display: 'inline-block',
                  fontSize: '1.8rem',
                  animationDelay: '0.2s'
                }}>•</span>
                <span style={{
                  animation: 'wave 1.4s infinite',
                  display: 'inline-block',
                  fontSize: '1.8rem',
                  animationDelay: '0.4s'
                }}>•</span>
              </span>
              <style jsx>{`
                @keyframes wave {
                  0%, 60%, 100% { transform: translateY(0); }
                  30% { transform: translateY(-8px); }
                }
              `}</style>
            </div>
          </div>
        )}
        
        {/* Invisible div for scroll target */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Fixed at bottom */}
      <div style={{
        padding: spacing.md,
        paddingBottom: `calc(${spacing.md} + env(safe-area-inset-bottom, 0px))`,
        borderTop: `1px solid ${colors.oliveGreen}`,
        backgroundColor: colors.warmBeige,
        flexShrink: 0
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