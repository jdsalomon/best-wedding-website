import { useState, useRef, useEffect } from 'react'
import * as React from 'react'
import { flushSync } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, spacing, borderRadius, transitions, modernSpacing, gradients, shadows, paperBackground, minimalTypography } from '../styles/theme'
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
  const { isAuthenticated, currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [showFAQButtons, setShowFAQButtons] = useState(true)
  const [faqPrompts, setFaqPrompts] = useState<FAQPrompt[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  
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
    setShowTimeoutMessage(false)
    
    // Always scroll when user sends a message
    setShouldAutoScroll(true)
    setTimeout(() => scrollToBottom(), 0)

    // Show timeout message after 15 seconds
    const timeoutTimer = setTimeout(() => {
      if (isThinking) {
        setShowTimeoutMessage(true)
      }
    }, 15000)

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
          setShowTimeoutMessage(false)
          clearTimeout(timeoutTimer)
          
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
          setShowTimeoutMessage(false)
          clearTimeout(timeoutTimer)
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
      setShowTimeoutMessage(false)
      clearTimeout(timeoutTimer)

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
      setShowTimeoutMessage(false)
      clearTimeout(timeoutTimer)
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
    
    // Check screen size for responsive layout
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        const isWide = window.innerWidth >= 768 && window.innerWidth / window.innerHeight >= 1.5
        setIsWideScreen(isWide)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
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
      background: 'transparent',
      flex: 1,
      minHeight: 0,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      border: 'none',
      borderRadius: 0
    }}>

      {/* Content Area - grows to fill remaining space */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: messages.length > 0 ? 'auto' : 'hidden',
          overflowX: 'hidden',
          padding: `${modernSpacing.base} ${isWideScreen ? 'clamp(3rem, 12vw, 8rem)' : 'clamp(1rem, 4vw, 1.5rem)'}`,
          background: 'transparent',
          minHeight: 0
        }}
      >
        {/* Welcome page layout when no messages */}
        {messages.length === 0 && showFAQButtons && isClient && faqPrompts.length > 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 0
          }}>
            {/* Welcome Message - fixed height */}
            <div style={{
              textAlign: 'center',
              flexShrink: 0,
              paddingBottom: modernSpacing.base
            }}>
              <h3 style={{
                fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)',
                marginBottom: modernSpacing.base,
                color: colors.deepOlive,
                ...minimalTypography.title,
                margin: `0 0 ${modernSpacing.base} 0`
              }}>
                {currentUser ? `${t('chat.welcomePersonal')} ${currentUser.first_name}` : t('chat.welcome')}
              </h3>
              <p style={{
                color: colors.deepOlive,
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                fontFamily: typography.interface,
                fontWeight: typography.regular,
                margin: 0,
                opacity: 0.9,
                letterSpacing: '0.01em'
              }}>
                {t('chat.aiHelper')}
              </p>
            </div>

            {/* Image - grows to fill remaining space */}
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 0
            }}>
              <img
                src="/images/estellejulien.png"
                alt="Estelle and Julien"
                style={{
                  maxHeight: '100%',
                  maxWidth: 'min(320px, 80vw)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  opacity: 0.9
                }}
              />
            </div>
          </div>
        )}

        
        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              marginBottom: modernSpacing.comfortable,
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              opacity: 1
            }}
          >
            <div
              style={{
                maxWidth: message.role === 'assistant' && message.rsvpData ? '100%' : message.role === 'assistant' ? '95%' : '85%',
                padding: message.role === 'assistant' && message.rsvpData 
                  ? 0 
                  : message.role === 'assistant' 
                    ? `${modernSpacing.base} 0`
                    : `${modernSpacing.base} ${modernSpacing.comfortable}`,
                borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '0px',
                background: message.role === 'user' 
                  ? gradients.oliveSubtle
                  : 'transparent',
                backdropFilter: message.role === 'user' ? 'none' : 'none',
                border: message.role === 'user' ? 'none' : 'none',
                color: message.role === 'user' ? colors.cream : colors.charcoal,
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontFamily: typography.interface,
                fontWeight: typography.regular,
                letterSpacing: '0.02em',
                lineHeight: 1.5,
                textAlign: 'left',
                overflow: 'hidden',
                boxShadow: message.role === 'user' ? shadows.medium : 'none',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
                lineBreak: 'strict',
                hangingPunctuation: 'allow-end',
                position: 'relative'
              }}
            >
              {/* AI Text Response */}
              {message.content && (
                <div style={{
                  paddingTop: message.role === 'assistant' && message.rsvpData ? spacing.sm : 0,
                  paddingLeft: message.role === 'assistant' && message.rsvpData ? spacing.sm : 0,
                  paddingRight: message.role === 'assistant' && message.rsvpData ? spacing.sm : 0,
                  paddingBottom: message.role === 'assistant' && message.rsvpData ? spacing.xs : 0
                }}>
                  <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({children}) => <span style={{margin: 0, lineHeight: 1.4, lineBreak: 'strict', hangingPunctuation: 'allow-end'}}>{children}</span>,
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
                    <div style={{
                      overflow: 'auto',
                      margin: '0.5rem 0',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${message.role === 'user' ? colors.cream : colors.oliveGreen}`,
                      background: message.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${message.role === 'user' ? colors.cream : colors.oliveGreen} transparent`,
                      position: 'relative'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9em',
                        border: 'none',
                        tableLayout: 'auto'
                      }}>
                        {children}
                      </table>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          height: 6px;
                        }
                        div::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                          background: ${message.role === 'user' ? colors.cream : colors.oliveGreen};
                          border-radius: 3px;
                          opacity: 0.6;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          opacity: 1;
                        }
                      `}</style>
                    </div>
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
                      color: colors.cream,
                      borderBottom: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(139, 149, 109, 0.3)'}`,
                      borderRight: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(139, 149, 109, 0.2)'}`,
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'break-word',
                      maxWidth: '200px',
                      verticalAlign: 'top'
                    }}>
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td style={{
                      padding: '0.5rem',
                      borderBottom: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(139, 149, 109, 0.2)'}`,
                      borderRight: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(139, 149, 109, 0.1)'}`,
                      color: message.role === 'user' ? colors.cream : colors.charcoal,
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'break-word',
                      maxWidth: '200px',
                      verticalAlign: 'top'
                    }}>
                      {children}
                    </td>
                  ),
                  pre: ({children}) => (
                    <div style={{
                      overflow: 'auto',
                      margin: '0.5rem 0',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${message.role === 'user' ? colors.cream : colors.oliveGreen}`,
                      background: message.role === 'user' ? 'rgba(0,0,0,0.2)' : 'rgba(139, 149, 109, 0.1)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${message.role === 'user' ? colors.cream : colors.oliveGreen} transparent`
                    }}>
                      <pre style={{
                        margin: 0,
                        padding: '0.75rem',
                        fontFamily: 'Monaco, "Courier New", monospace',
                        fontSize: '0.85em',
                        lineHeight: 1.4,
                        color: message.role === 'user' ? colors.cream : colors.charcoal,
                        whiteSpace: 'pre',
                        overflowWrap: 'anywhere'
                      }}>
                        {children}
                      </pre>
                    </div>
                  ),
                  code: ({children, className}) => {
                    // Inline code (no className means it's inline)
                    if (!className) {
                      return (
                        <code style={{
                          backgroundColor: message.role === 'user' ? 'rgba(0,0,0,0.2)' : 'rgba(139, 149, 109, 0.15)',
                          color: message.role === 'user' ? colors.cream : colors.charcoal,
                          padding: '0.2rem 0.4rem',
                          borderRadius: borderRadius.sm,
                          fontFamily: 'Monaco, "Courier New", monospace',
                          fontSize: '0.9em'
                        }}>
                          {children}
                        </code>
                      )
                    }
                    // Block code (has className, will be wrapped by pre element above)
                    return <code className={className}>{children}</code>
                  }
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
                    marginTop: message.content ? spacing.sm : 0, // Add spacing if there's text above
                    padding: 0 // Remove padding since assistant messages no longer have bubble styling
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
            marginBottom: spacing.md,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: modernSpacing.xs
          }}>
            <div style={{
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.charcoal,
              fontSize: '1.2rem',
              fontFamily: typography.interface,
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
            {showTimeoutMessage && (
              <div style={{
                padding: `${modernSpacing.xs} ${modernSpacing.base}`,
                borderRadius: borderRadius.md,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: `1px solid rgba(139, 149, 109, 0.3)`,
                color: colors.deepOlive,
                fontSize: '0.9rem',
                fontFamily: typography.body,
                fontStyle: 'italic',
                maxWidth: '85%'
              }}>
                Taking a bit longer than usual, please wait...
              </div>
            )}
          </div>
        )}
        
        {/* Invisible div for scroll target */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* FAQ Buttons - Fixed proportion of viewport */}
      {messages.length === 0 && showFAQButtons && isClient && faqPrompts.length > 0 && (
        <div style={{
          flexBasis: '15vh',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${modernSpacing.tiny} ${modernSpacing.comfortable}`,
          background: 'transparent'
        }}>
          {/* Suggestion title */}
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            color: colors.deepOlive,
            fontFamily: typography.interface,
            fontWeight: typography.regular,
            margin: `0 0 ${modernSpacing.xs} 0`,
            opacity: 0.6,
            textAlign: 'center'
          }}>
            {t('chat.suggestionTitle')}
          </p>
          
          {/* Small horizontal FAQ buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(max-content, 1fr))',
            gap: modernSpacing.xs,
            width: '100%'
          }}>
            {faqPrompts.map((prompt, index) => (
              <button
                key={prompt.id}
                onClick={() => handleFAQClick(prompt)}
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  border: `1px solid rgba(139, 149, 109, 0.2)`,
                  borderRadius: '8px',
                  padding: `${modernSpacing.tiny} ${modernSpacing.xs}`,
                  fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                  fontFamily: typography.interface,
                  fontWeight: typography.regular,
                  color: colors.deepOlive,
                  opacity: 0.6,
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  transition: transitions.normal,
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  lineBreak: 'strict',
                  hangingPunctuation: 'allow-end',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 149, 109, 0.3)'
                  e.currentTarget.style.color = colors.cream
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
                  e.currentTarget.style.color = colors.deepOlive
                  e.currentTarget.style.opacity = '0.8'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {t(prompt.titleKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div style={{
        paddingTop: modernSpacing.base,
        paddingLeft: isWideScreen ? 'clamp(3rem, 12vw, 8rem)' : modernSpacing.comfortable,
        paddingRight: isWideScreen ? 'clamp(3rem, 12vw, 8rem)' : modernSpacing.comfortable,
        paddingBottom: `calc(${modernSpacing.base} + env(safe-area-inset-bottom, 0px))`,
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid rgba(139, 149, 109, 0.2)`,
        flexShrink: 0
      }}>
        {/* Subtle top gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
        }} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernSpacing.base,
          background: 'rgba(255, 255, 255, 0.8)',
          border: `1px solid rgba(139, 149, 109, 0.3)`,
          borderRadius: '20px',
          padding: `${modernSpacing.tiny} ${modernSpacing.base}`,
          backdropFilter: 'blur(10px)',
          boxShadow: shadows.soft,
          transition: transitions.normal
        }}
        onFocus={() => {
          // Add focus styles via parent container
        }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              fontFamily: typography.interface,
              fontWeight: typography.regular,
              letterSpacing: '0.02em',
              color: colors.charcoal,
              resize: 'none' as const,
              minHeight: '20px',
              maxHeight: '100px',
              outline: 'none',
              padding: `${modernSpacing.tiny} 0`,
              lineHeight: 1.4,
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              lineBreak: 'strict',
              hangingPunctuation: 'allow-end'
            }}
            placeholder={t('chat.placeholder')}
            disabled={isThinking}
            onFocus={(e) => {
              e.currentTarget.parentElement!.style.borderColor = colors.oliveGreen
              e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.95)'
            }}
            onBlur={(e) => {
              e.currentTarget.parentElement!.style.borderColor = 'rgba(139, 149, 109, 0.3)'
              e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.8)'
            }}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isThinking || !input.trim()}
            style={{
              background: isThinking || !input.trim() 
                ? 'rgba(139, 149, 109, 0.3)' 
                : gradients.oliveSubtle,
              color: colors.cream,
              border: 'none',
              borderRadius: '16px',
              padding: `${modernSpacing.base} ${modernSpacing.comfortable}`,
              cursor: isThinking || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontFamily: typography.interface,
              fontWeight: typography.regular,
              transition: transitions.spring,
              whiteSpace: 'nowrap' as const,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: modernSpacing.xs,
              boxShadow: isThinking || !input.trim() ? 'none' : shadows.soft
            }}
            onMouseEnter={(e) => {
              if (!isThinking && input.trim()) {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'
                e.currentTarget.style.boxShadow = shadows.medium
              }
            }}
            onMouseLeave={(e) => {
              if (!isThinking && input.trim()) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = shadows.soft
              }
            }}
          >
            {isThinking ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid rgba(255,255,255,0.8)',
                  borderRadius: '50%'
                }} />
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}

export default InlineChatInterface