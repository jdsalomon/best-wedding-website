import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { colors, typography, spacing, borderRadius } from '../styles/theme'

interface ChatBarProps {
  onSendMessage: (message: string) => void
}

const ChatBar = ({ onSendMessage }: ChatBarProps) => {
  const { t } = useTranslation()
  const [input, setInput] = useState('')

  const handleSendMessage = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div style={{
      backgroundColor: colors.cream,
      border: `2px solid ${colors.oliveGreen}`,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
        fontWeight: typography.bold,
        fontFamily: typography.heading,
        marginBottom: spacing.md,
        color: colors.oliveGreen,
        textAlign: 'center'
      }}>
        💬 {t('chat.barTitle')}
      </div>
      
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('chat.placeholder')}
          style={{
            width: '100%',
            padding: `${spacing.md} 90px ${spacing.md} ${spacing.md}`,
            fontSize: '1.1rem',
            fontFamily: typography.body,
            border: `2px solid ${colors.oliveGreen}`,
            borderRadius: borderRadius.md,
            backgroundColor: colors.warmBeige,
            color: colors.charcoal,
            outline: 'none',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box' as const
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.deepOlive
            e.currentTarget.style.backgroundColor = colors.cream
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.oliveGreen
            e.currentTarget.style.backgroundColor = colors.warmBeige
          }}
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!input.trim()}
          style={{
            position: 'absolute',
            right: spacing.sm,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: colors.oliveGreen,
            color: colors.cream,
            border: 'none',
            borderRadius: borderRadius.sm,
            padding: `${spacing.xs} ${spacing.sm}`,
            fontSize: '0.9rem',
            fontFamily: typography.body,
            fontWeight: typography.medium,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.5,
            transition: 'all 0.3s ease',
            minWidth: '70px',
            boxSizing: 'border-box' as const,
            whiteSpace: 'nowrap' as const
          }}
          onMouseEnter={(e) => {
            if (input.trim()) {
              e.currentTarget.style.backgroundColor = colors.deepOlive
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.oliveGreen
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatBar