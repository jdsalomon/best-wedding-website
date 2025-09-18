import { ReactNode, useState, useRef, useEffect } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
import { useDynamicFontSize } from '../hooks/useDynamicFontSize'
import { useLanguageContext } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { colors, typography, gradients, spacing, borderRadius, shadows, transitions, glassMorphism, modernSpacing, paperBackground, minimalTypography } from '../styles/theme'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageContext()
  const { isAuthenticated, group, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const router = useRouter()

  // Get wedding header text
  const headerText = t('home.weddingLineMobile')

  // Track button width dynamically
  const [buttonWidth, setButtonWidth] = useState(110) // Initial estimate
  const buttonRef = useRef<HTMLDivElement>(null)

  // ResizeObserver for button width
  useEffect(() => {
    if (!buttonRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setButtonWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(buttonRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Dynamic font sizing with measured button width
  const { fontSize, containerRef } = useDynamicFontSize({
    text: headerText,
    fontFamily: "'Futura', 'Avenir Next', 'Century Gothic', 'Helvetica Neue', sans-serif",
    fontWeight: 300,
    letterSpacing: '0.15em',
    minSize: 8,
    maxSize: 20,
    buttonWidth: buttonWidth,
    gapWidth: 16 // 1rem
  })

  // Check screen orientation and mobile status
  React.useEffect(() => {
    const checkScreenProperties = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width < 480)
      setIsLandscape(width > height && width >= 1024) // Landscape and reasonably wide
    }
    checkScreenProperties()
    window.addEventListener('resize', checkScreenProperties)
    return () => window.removeEventListener('resize', checkScreenProperties)
  }, [])

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: typography.interface,
      background: paperBackground.primary,
      color: colors.charcoal
    }}>
      {/* Modern Responsive Header */}
      <header style={{
        flexShrink: 0,
        zIndex: 1000,
        background: 'transparent',
        border: 'none'
      }}>
        <div
          ref={containerRef}
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.base} ${modernSpacing.base}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            minHeight: isMobile ? '40px' : '50px'
          }}>

          {/* Wedding Title - Dynamic Font Sizing to Always Fit */}
          <h1 style={{
            margin: 0,
            fontSize: fontSize,
            ...minimalTypography.title,
            color: colors.deepOlive,
            textShadow: '0 1px 2px rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
            flex: 1,
            minWidth: 0
          }}>
            {headerText}
          </h1>

          {/* Navigation Buttons - Right Aligned */}
          <nav
            ref={buttonRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.75rem',
              flexShrink: 0
            }}>
            {/* Auth Status */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: `1px solid rgba(60, 60, 60, 0.2)`,
                  borderRadius: borderRadius.sm,
                  padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                  color: colors.charcoal,
                  fontFamily: typography.chat,
                  fontWeight: typography.light,
                  transition: transitions.normal,
                  whiteSpace: 'nowrap',
                  minHeight: '44px' // Touch-friendly minimum
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                  e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.2)'
                }}
              >
                {isMobile ? 'Exit' : t('auth.logout')}
              </button>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: `1px solid rgba(60, 60, 60, 0.2)`,
                    borderRadius: borderRadius.sm,
                    padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                    color: colors.charcoal,
                    fontFamily: typography.interface,
                    fontWeight: typography.light,
                    transition: transitions.normal,
                    whiteSpace: 'nowrap',
                    minHeight: '44px' // Touch-friendly minimum
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                    e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                    e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.2)'
                  }}
                >
                  {isMobile ? 'Login' : t('auth.login')}
                </button>
              </Link>
            )}
            
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: `1px solid rgba(60, 60, 60, 0.2)`,
                borderRadius: borderRadius.sm,
                padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                cursor: 'pointer',
                fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                color: colors.charcoal,
                fontFamily: typography.chat,
                fontWeight: typography.light,
                transition: transitions.normal,
                whiteSpace: 'nowrap',
                minWidth: 'clamp(32px, 5vw, 44px)',
                minHeight: '44px' // Touch-friendly minimum
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(60, 60, 60, 0.2)'
              }}
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>
          </nav>
        </div>
      </header>
      
      {/* Content Area - Takes remaining space */}
      <main style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {children}
      </main>
      
    </div>
  )
}

// HIDDEN - Original navigation links (preserved for future use)
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