import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguageContext } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { colors, typography, gradients, spacing, borderRadius, shadows, transitions, glassMorphism, modernSpacing } from '../styles/theme'
import WeddingChatbot, { ChatToggleButton } from './WeddingChatbot'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageContext()
  const { isAuthenticated, group, logout } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const router = useRouter()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div style={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: typography.body,
      background: gradients.subtleWarmth,
      color: colors.charcoal
    }}>
      {/* Modern Glass Navigation - Fixed Header */}
      <header style={{
        flexShrink: 0,
        zIndex: 1000,
        backdropFilter: glassMorphism.backdrop,
        background: glassMorphism.background,
        border: glassMorphism.border,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: `${modernSpacing.comfortable} ${modernSpacing.base}`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: modernSpacing.base,
          minHeight: '60px'
        }}>
          
          {/* Wedding Title & Date */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: modernSpacing.xs
          }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
              fontFamily: typography.heading,
              fontWeight: typography.bold,
              color: colors.deepOlive,
              letterSpacing: '-0.02em'
            }}>
              {t('home.title')}
            </h1>
            <div style={{
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              fontFamily: typography.body,
              fontWeight: typography.medium,
              color: colors.oliveGreen,
              display: 'flex',
              alignItems: 'center',
              gap: modernSpacing.xs,
              position: 'relative',
              paddingLeft: '12px'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: colors.sageGreen
              }} />
              {t('home.date')} • {t('home.location')}
            </div>
          </div>

          {/* Auth & Language Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            flexShrink: 0,
            flexWrap: 'wrap'
          }}>
            {/* Auth Status */}
            {isAuthenticated ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: modernSpacing.tiny,
                padding: `${modernSpacing.xs} ${modernSpacing.base}`,
                backgroundColor: 'rgba(139, 149, 109, 0.1)',
                borderRadius: borderRadius.lg,
                border: `1px solid rgba(139, 149, 109, 0.2)`
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: colors.deepOlive,
                  fontWeight: typography.medium,
                  fontFamily: typography.body
                }}>
                  Welcome, {group?.name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: `1px solid ${colors.deepOlive}`,
                    borderRadius: borderRadius.sm,
                    padding: `${modernSpacing.xs} ${modernSpacing.tiny}`,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: colors.deepOlive,
                    fontFamily: typography.body,
                    fontWeight: typography.medium,
                    transition: transitions.normal,
                    marginLeft: modernSpacing.xs
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.deepOlive
                    e.currentTarget.style.color = colors.cream
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.deepOlive
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: colors.oliveGreen,
                    border: 'none',
                    borderRadius: borderRadius.lg,
                    padding: `${modernSpacing.base} ${modernSpacing.comfortable}`,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: colors.cream,
                    fontFamily: typography.body,
                    fontWeight: typography.semibold,
                    transition: transitions.spring,
                    boxShadow: shadows.soft
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.deepOlive
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = shadows.medium
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.oliveGreen
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = shadows.soft
                  }}
                >
                  {t('auth.login')}
                </button>
              </Link>
            )}
            
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: `1px solid rgba(139, 149, 109, 0.3)`,
                borderRadius: borderRadius.lg,
                padding: `${modernSpacing.tiny} ${modernSpacing.base}`,
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: colors.deepOlive,
                fontFamily: typography.body,
                fontWeight: typography.medium,
                transition: transitions.spring,
                display: 'flex',
                alignItems: 'center',
                gap: modernSpacing.xs
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.borderColor = colors.oliveGreen
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(139, 149, 109, 0.3)'
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
      
      {/* Chat Components - HIDDEN (main page now has prominent chat) */}
      <div style={{ display: 'none' }}>
        {!isChatOpen && (
          <ChatToggleButton onClick={() => setIsChatOpen(true)} />
        )}
        <WeddingChatbot 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>
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