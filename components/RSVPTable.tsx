import React, { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { colors, spacing, borderRadius, shadows } from '../styles/theme'

interface Event {
  id: string
  event_id: string
  name: string
  description?: string
  date: string
}

interface Guest {
  id: string
  first_name: string
  last_name: string
}

interface RSVPData {
  events: Event[]
  guests: Guest[]
  responses: Record<string, Record<string, string>> // eventId -> guestId -> response
}

interface RSVPTableProps {
  rsvpData: RSVPData
  onSubmit: (responses: RSVPResponse[]) => Promise<void>
}

interface RSVPResponse {
  guestId: string
  eventId: string
  response: 'yes' | 'no' | 'no_answer'
}

const RSVPTable: React.FC<RSVPTableProps> = ({ rsvpData, onSubmit }) => {
  const { t } = useTranslation()
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>(
    rsvpData.responses
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleResponseChange = (guestId: string, eventId: string, response: string) => {
    setResponses(prev => {
      const newResponses = {
        ...prev,
        [eventId]: {
          ...prev[eventId],
          [guestId]: response
        }
      }
      
      // Check if there are changes from original
      const hasChanges = JSON.stringify(newResponses) !== JSON.stringify(rsvpData.responses)
      setHasChanges(hasChanges)
      
      return newResponses
    })
  }

  const handleSubmit = async () => {
    if (!hasChanges || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Build list of changed responses
      const changedResponses: RSVPResponse[] = []
      
      rsvpData.events.forEach(event => {
        rsvpData.guests.forEach(guest => {
          const currentResponse = responses[event.id]?.[guest.id]
          const originalResponse = rsvpData.responses[event.id]?.[guest.id]
          
          if (currentResponse !== originalResponse) {
            changedResponses.push({
              guestId: guest.id,
              eventId: event.id,
              response: currentResponse as 'yes' | 'no' | 'no_answer'
            })
          }
        })
      })

      if (changedResponses.length > 0) {
        await onSubmit(changedResponses)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error submitting RSVP responses:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get the next response state in the cycle
  const getNextResponse = (currentResponse: string): string => {
    switch (currentResponse) {
      case 'no_answer':
        return 'yes'
      case 'yes':
        return 'no'
      case 'no':
        return 'no_answer'
      default:
        return 'yes'
    }
  }

  // Single button styling based on current state
  const getSingleButtonStyle = (currentResponse: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: `min(6px, 1.5vw) min(8px, 2vw)`, // Responsive padding
      margin: 0,
      border: 'none',
      borderRadius: borderRadius.sm,
      fontSize: 'min(11px, 3vw)', // Responsive font size
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: 'min(70px, 20vw)', // Responsive button width
      minWidth: '44px', // Minimum touch target size for accessibility
      height: 'max(28px, 44px)', // Ensure minimum touch target height
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }

    switch (currentResponse) {
      case 'yes':
        return {
          ...baseStyle,
          backgroundColor: colors.success,
          color: 'white',
          border: `2px solid ${colors.success}`
        }
      case 'no':
        return {
          ...baseStyle,
          backgroundColor: '#dc3545', // Red for no
          color: 'white',
          border: `2px solid #dc3545`
        }
      case 'no_answer':
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.cream,
          color: colors.softGray,
          border: `2px dashed ${colors.sageGreen}`,
          fontSize: '16px', // Larger for the question mark
          fontWeight: 'normal'
        }
    }
  }

  if (!rsvpData.events.length) {
    return (
      <div style={{
        padding: spacing.md,
        textAlign: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.softGray}`,
        margin: `${spacing.md} 0`
      }}>
        <p style={{ color: colors.textSecondary }}>
          No events available for RSVP at this time.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'transparent', // No background, will inherit from chat message
      boxShadow: 'none', // No shadow, chat message handles this
      margin: 0, // No margin, will be handled by chat message
      overflow: 'hidden',
      border: `1px solid ${colors.oliveGreen}`, // Subtle border using chat theme
      borderRadius: borderRadius.sm // Small radius for inner content
    }}>
      <style jsx>{`
        .rsvp-scroll-container::-webkit-scrollbar {
          height: 4px;
        }
        .rsvp-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .rsvp-scroll-container::-webkit-scrollbar-thumb {
          background: #8B956D;
          border-radius: 2px;
        }
        .rsvp-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #6B7353;
        }
      `}</style>
      {/* RSVP Table */}
      <div 
        className="rsvp-scroll-container"
        style={{ 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollbarWidth: 'thin', // Thin scrollbar on Firefox
          msOverflowStyle: 'none', // Hide scrollbar on IE
          scrollBehavior: 'smooth'
        }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px',
          tableLayout: 'fixed', // Fixed layout for consistent column widths
          minWidth: 'max(280px, 100%)', // Responsive minimum width
          boxSizing: 'border-box'
        }}>
          <thead>
            <tr style={{ backgroundColor: colors.sageGreen }}>
              <th style={{
                padding: `8px min(12px, 2vw)`, // Responsive padding
                textAlign: 'left',
                borderBottom: `1px solid ${colors.oliveGreen}`,
                fontWeight: 'bold',
                width: 'min(90px, 25vw)', // Responsive width: 90px or 25% of viewport width
                minWidth: '60px', // Minimum usable width
                color: colors.charcoal,
                fontSize: 'min(13px, 3.5vw)', // Responsive font size
                borderTopLeftRadius: borderRadius.sm, // Round top-left corner
                boxSizing: 'border-box',
                whiteSpace: 'normal', // Allow text wrapping
                wordBreak: 'break-word', // Break long words if needed
                hyphens: 'auto' // Add hyphens for better breaking
              }}>
                Guest
              </th>
              {rsvpData.events.map((event, index) => (
                <th key={event.id} style={{
                  padding: `8px min(12px, 2vw)`, // Responsive padding same as Guest column
                  textAlign: 'center',
                  borderBottom: `1px solid ${colors.oliveGreen}`,
                  fontWeight: 'bold',
                  width: 'min(90px, 25vw)', // Responsive width same as Guest column
                  minWidth: '60px', // Minimum usable width
                  color: colors.charcoal,
                  fontSize: 'min(13px, 3.5vw)', // Responsive font size
                  borderTopRightRadius: index === rsvpData.events.length - 1 ? borderRadius.sm : 0, // Round top-right corner for last column
                  whiteSpace: 'normal', // Allow text wrapping
                  wordBreak: 'break-word', // Break long words if needed
                  hyphens: 'auto', // Add hyphens for better breaking
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      lineHeight: 1.2
                    }}>
                      {event.name.replace(/\s+/g, '\n')}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: colors.deepOlive,
                      marginTop: '2px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: 1.1
                    }}>
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rsvpData.guests.map((guest, guestIndex) => (
              <tr key={guest.id} style={{
                backgroundColor: guestIndex % 2 === 0 ? colors.cream : colors.warmBeige
              }}>
                <td style={{
                  padding: `8px min(12px, 2vw)`, // Responsive padding same as headers
                  borderBottom: `1px solid ${colors.sageGreen}`,
                  fontWeight: '500',
                  fontSize: 'min(13px, 3.5vw)', // Responsive font size
                  color: colors.charcoal,
                  width: 'min(90px, 25vw)', // Responsive width same as headers
                  minWidth: '60px', // Minimum usable width
                  whiteSpace: 'normal', // Allow text wrapping
                  wordBreak: 'break-word', // Break long words if needed
                  hyphens: 'auto', // Add hyphens for better breaking
                  boxSizing: 'border-box',
                  lineHeight: 1.2
                }}>
                  {guest.first_name.replace(/\s+/g, '\n')} {guest.last_name.replace(/\s+/g, '\n')}
                </td>
                {rsvpData.events.map(event => {
                  const currentResponse = responses[event.id]?.[guest.id] || 'no_answer'
                  
                  return (
                    <td key={event.id} style={{
                      padding: `8px min(12px, 2vw)`, // Responsive padding same as headers
                      borderBottom: `1px solid ${colors.sageGreen}`,
                      textAlign: 'center',
                      width: 'min(90px, 25vw)', // Responsive width same as headers
                      minWidth: '60px', // Minimum usable width
                      boxSizing: 'border-box',
                      verticalAlign: 'middle'
                    }}>
                      <button
                        onClick={() => handleResponseChange(guest.id, event.id, getNextResponse(currentResponse))}
                        style={getSingleButtonStyle(currentResponse)}
                        title={currentResponse === 'yes' ? 'Going (click to change to Not Going)' : 
                               currentResponse === 'no' ? 'Not Going (click to change to No Answer)' : 
                               'No Answer (click to change to Going)'}
                      >
                        {currentResponse === 'yes' ? 'Go' : 
                         currentResponse === 'no' ? 'No' : 
                         '?'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div 
        onClick={hasChanges && !isSubmitting ? handleSubmit : undefined}
        style={{
          padding: `${spacing.xs}`, // Much smaller padding
          textAlign: 'center',
          borderTop: `1px solid ${colors.oliveGreen}`,
          backgroundColor: hasChanges && !isSubmitting ? colors.oliveGreen : colors.sageGreen,
          color: hasChanges && !isSubmitting ? colors.cream : colors.charcoal,
          borderBottomLeftRadius: borderRadius.sm, // Round bottom corners
          borderBottomRightRadius: borderRadius.sm,
          cursor: hasChanges && !isSubmitting ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          fontSize: '12px', // Smaller font
          fontWeight: '500',
          userSelect: 'none',
          minHeight: '32px', // Smaller height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor = hasChanges ? colors.deepOlive : colors.oliveGreen
            e.currentTarget.style.boxShadow = `0 0 12px ${colors.oliveGreen}`
            e.currentTarget.style.transform = 'scale(1.02)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor = hasChanges ? colors.oliveGreen : colors.sageGreen
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {isSubmitting ? 'Submitting...' : hasChanges ? 'RSVP' : 'All Set'}
      </div>
    </div>
  )
}

export default RSVPTable