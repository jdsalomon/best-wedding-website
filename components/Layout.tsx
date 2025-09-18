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
  const [screenWidth, setScreenWidth] = useState(0)
  const router = useRouter()

  // Get wedding header text
  const headerText = t('home.weddingLineMobile')

  // Track button width dynamically
  const [buttonWidth, setButtonWidth] = useState(110) // Initial estimate
  const buttonRef = useRef<HTMLDivElement>(null)

  // Check screen orientation and mobile status
  React.useEffect(() => {
    const checkScreenProperties = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width < 480)
      setIsLandscape(width > height && width >= 1024) // Landscape and reasonably wide
      setScreenWidth(width) // Track width for responsive button styling
    }
    checkScreenProperties()
    window.addEventListener('resize', checkScreenProperties)
    return () => window.removeEventListener('resize', checkScreenProperties)
  }, [])

  // Responsive button styling with JavaScript breakpoints
  const getResponsiveButtonStyle = () => {
    const width = screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 481)

    let responsiveStyles = {
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      minHeight: '36px'
    }

    if (width <= 380) {
      responsiveStyles = {
        padding: '0.2rem 0.4rem',
        fontSize: '0.7rem',
        minHeight: '32px'
      }
    } else if (width >= 769) {
      responsiveStyles = {
        padding: '0.4rem 0.75rem',
        fontSize: '0.85rem',
        minHeight: '42px'
      }
    } else if (width >= 481) {
      responsiveStyles = {
        padding: '0.3rem 0.6rem',
        fontSize: '0.8rem',
        minHeight: '38px'
      }
    }

    return {
      ...responsiveStyles,
      background: 'rgba(255, 255, 255, 0.6)',
      border: `1px solid rgba(60, 60, 60, 0.2)`,
      borderRadius: borderRadius.sm,
      cursor: 'pointer' as const,
      color: colors.charcoal,
      fontWeight: typography.light,
      transition: transitions.normal,
      whiteSpace: 'nowrap' as const,
    }
  }

  const baseButtonStyle = getResponsiveButtonStyle()

  // Responsive gaps for container and navigation
  const getResponsiveGap = () => {
    if (typeof window === 'undefined') return '0.5rem' // SSR default
    const width = screenWidth || window.innerWidth

    if (width <= 380) return '0.4rem'  // Covers 350px screens
    if (width <= 480) return '0.5rem'
    if (width <= 768) return '0.6rem'
    return '0.75rem'
  }

  const responsiveGap = getResponsiveGap()

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

  // Dynamic font sizing with measured button width and responsive gap
  const { fontSize, containerRef } = useDynamicFontSize({
    text: headerText,
    fontFamily: "'Futura', 'Avenir Next', 'Century Gothic', 'Helvetica Neue', sans-serif",
    fontWeight: 300,
    letterSpacing: '0.15em',
    minSize: 10, // Increased minimum for better readability
    maxSize: 20,
    buttonWidth: buttonWidth,
    gapWidth: parseFloat(responsiveGap) * 16 // Convert rem to px (1rem = 16px)
  })

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
            gap: responsiveGap,
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
              gap: responsiveGap,
              flexShrink: 0
            }}>
            {/* Auth Status */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  ...baseButtonStyle,
                  fontFamily: typography.chat
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
                    ...baseButtonStyle,
                    fontFamily: typography.interface
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
                ...baseButtonStyle,
                fontFamily: typography.chat,
                minWidth: '44px' // Fixed minimum for touch target (overrides base)
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