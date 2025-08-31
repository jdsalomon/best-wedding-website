import { ReactNode, useState } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguageContext } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { colors, typography, gradients, spacing, borderRadius, shadows, transitions, glassMorphism, modernSpacing } from '../styles/theme'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageContext()
  const { isAuthenticated, group, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Check if mobile screen
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
      fontFamily: typography.body,
      background: gradients.subtleWarmth,
      color: colors.charcoal
    }}>
      {/* Clean Single-Line Wedding Header */}
      <header style={{
        flexShrink: 0,
        zIndex: 1000,
        background: 'rgba(139, 149, 109, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.base} ${modernSpacing.base}`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: isMobile ? modernSpacing.xs : modernSpacing.base,
          minHeight: isMobile ? '40px' : '50px',
          overflow: 'hidden'
        }}>
          
          {/* Always Show Wedding Info - Responsive */}
          <div style={{ 
            flex: 1,
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 'clamp(0.85rem, 4vw, 1.1rem)' : 'clamp(1.2rem, 3.5vw, 1.6rem)',
              fontFamily: typography.heading,
              fontWeight: typography.bold,
              color: colors.cream,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isMobile 
                ? t('home.weddingLineMobile')
                : `${t('home.weddingLine')} • ${t('home.date')} • ${t('home.location')}`
              }
            </h1>
          </div>

          {/* Compact Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? modernSpacing.xs : modernSpacing.base,
            flexShrink: 0
          }}>
            {/* Auth Status */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: `1px solid rgba(255, 255, 255, 0.4)`,
                  borderRadius: borderRadius.sm,
                  padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.xs} ${modernSpacing.base}`,
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: colors.cream,
                  fontFamily: typography.body,
                  fontWeight: typography.medium,
                  transition: transitions.normal,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                }}
              >
                {isMobile ? 'Exit' : t('auth.logout')}
              </button>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: `1px solid rgba(255, 255, 255, 0.4)`,
                    borderRadius: borderRadius.sm,
                    padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.xs} ${modernSpacing.base}`,
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: colors.cream,
                    fontFamily: typography.body,
                    fontWeight: typography.medium,
                    transition: transitions.normal,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
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
                background: 'rgba(255, 255, 255, 0.15)',
                border: `1px solid rgba(255, 255, 255, 0.4)`,
                borderRadius: borderRadius.sm,
                padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.xs} ${modernSpacing.base}`,
                cursor: 'pointer',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: colors.cream,
                fontFamily: typography.body,
                fontWeight: typography.medium,
                transition: transitions.normal,
                whiteSpace: 'nowrap',
                minWidth: isMobile ? '32px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
              }}
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>
          </div>
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