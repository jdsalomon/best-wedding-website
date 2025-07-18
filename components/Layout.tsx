import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, gradients, spacing, borderRadius, shadows } from '../styles/theme'
import WeddingChatbot, { ChatToggleButton } from './WeddingChatbot'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageContext()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: typography.body,
      background: gradients.warmBackground,
      color: colors.charcoal
    }}>
      <nav style={{
        backgroundColor: colors.warmBeige,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 'none',
        height: '60px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '100%' }}>
          
          {/* Section Navigation - takes up most of the width */}
          <div style={{ flex: 1, display: 'flex', height: '100%' }}>
            <NavLinks />
          </div>
          
          {/* Language switcher - fixed width */}
          <div style={{ flexShrink: 0, marginLeft: spacing.md, marginRight: spacing.md }}>
            <button
              onClick={toggleLanguage}
              style={{
                background: 'none',
                border: `1px solid ${colors.oliveGreen}`,
                borderRadius: borderRadius.md,
                padding: `${spacing.xs} ${spacing.sm}`,
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: colors.oliveGreen,
                fontFamily: typography.body,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.oliveGreen
                e.currentTarget.style.color = colors.warmBeige
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = colors.oliveGreen
              }}
            >
              {language === 'en' ? '🇫🇷 FR' : '🇺🇸 EN'}
            </button>
          </div>
        </div>
      </nav>
      
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: `${spacing.xl} ${spacing.md}` 
      }}>
        {children}
      </main>
      
      {/* Chat Components */}
      {!isChatOpen && (
        <ChatToggleButton onClick={() => setIsChatOpen(true)} />
      )}
      <WeddingChatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  )
}

const NavLinks = () => {
  const { t } = useTranslation()
  
  const linkStyle = {
    textDecoration: 'none',
    color: colors.oliveGreen,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    fontFamily: typography.body,
    fontWeight: typography.medium,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    textAlign: 'center' as const
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <a 
        onClick={() => scrollToSection('program')}
        style={linkStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.oliveGreen
          e.currentTarget.style.color = colors.warmBeige
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = colors.oliveGreen
        }}
      >
        {t('nav.program')}
      </a>
      <a 
        onClick={() => scrollToSection('transportation')}
        style={linkStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.oliveGreen
          e.currentTarget.style.color = colors.warmBeige
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = colors.oliveGreen
        }}
      >
        {t('nav.transportation')}
      </a>
      <a 
        onClick={() => scrollToSection('hotels')}
        style={linkStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.oliveGreen
          e.currentTarget.style.color = colors.warmBeige
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = colors.oliveGreen
        }}
      >
        {t('nav.hotels')}
      </a>
      <a 
        onClick={() => scrollToSection('wedding-list')}
        style={linkStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.oliveGreen
          e.currentTarget.style.color = colors.warmBeige
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = colors.oliveGreen
        }}
      >
        {t('nav.weddingList')}
      </a>
    </div>
  )
}

export default Layout