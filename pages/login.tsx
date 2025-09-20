import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
import { useDynamicFontSize } from '../hooks/useDynamicFontSize'
import { useLanguageContext } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { colors, typography, modernSpacing, transitions, paperBackground, shadows, minimalTypography, borderRadius } from '../styles/theme'

type LoginResponse = {
  success: boolean
  message: string
  group?: {
    id: string
    name: string
    guests: Array<{
      id: string
      first_name: string
      last_name: string
      phone?: string
      email?: string
    }>
  }
}

const LoginPage = () => {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageContext()
  const { login } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [screenWidth, setScreenWidth] = useState(481) // Default to avoid hydration mismatch

  // Header refs for responsive design
  const buttonRef = useRef<HTMLDivElement>(null)
  const [buttonWidth, setButtonWidth] = useState(110)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(formData.firstName, formData.lastName)

      if (result.success) {
        // Redirect to home page
        router.push('/')
      } else {
        setError(result.message || t('auth.loginError'))
      }
    } catch (err) {
      setError(t('auth.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  // Get wedding header text
  const headerText = t('home.weddingLineMobile')

  // Responsive button styling
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
      fontFamily: typography.interface,
      fontWeight: typography.light,
      transition: transitions.normal,
      whiteSpace: 'nowrap' as const,
    }
  }

  // Responsive gaps
  const getResponsiveGap = () => {
    const width = screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 481)

    if (width <= 380) return '0.4rem'
    if (width <= 480) return '0.5rem'
    if (width <= 768) return '0.6rem'
    return '0.75rem'
  }

  const baseButtonStyle = getResponsiveButtonStyle()
  const responsiveGap = getResponsiveGap()

  // Dynamic font sizing
  const { fontSize, containerRef } = useDynamicFontSize({
    text: headerText,
    fontFamily: "'Futura', 'Avenir Next', 'Century Gothic', 'Helvetica Neue', sans-serif",
    fontWeight: 300,
    letterSpacing: '0.15em',
    minSize: 10,
    maxSize: 20,
    buttonWidth: buttonWidth,
    gapWidth: parseFloat(responsiveGap) * 16
  })

  // Check screen orientation and mobile status
  useEffect(() => {
    const checkScreenProperties = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width < 480)
      setIsLandscape(width > height && width >= 1024)
      setScreenWidth(width)
    }
    checkScreenProperties()
    window.addEventListener('resize', checkScreenProperties)
    return () => window.removeEventListener('resize', checkScreenProperties)
  }, [])

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

  const inputStyle = {
    width: '100%',
    padding: modernSpacing.comfortable,
    border: `1px solid rgba(139, 149, 109, 0.2)`,
    borderRadius: '12px',
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    fontFamily: typography.interface,
    fontWeight: typography.light,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    color: colors.deepOlive,
    outline: 'none' as const,
    transition: transitions.normal,
    backdropFilter: 'blur(10px)',
    letterSpacing: '0.01em'
  }

  const isFormValid = formData.firstName.trim() && formData.lastName.trim()

  const buttonStyle = {
    width: '100%',
    padding: modernSpacing.comfortable,
    backgroundColor: isFormValid && !loading ? colors.oliveGreen : 'rgba(255, 255, 255, 0.4)',
    color: isFormValid && !loading ? colors.cream : colors.deepOlive,
    border: `1px solid ${isFormValid && !loading ? colors.oliveGreen : 'rgba(139, 149, 109, 0.2)'}`,
    borderRadius: '16px',
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    fontFamily: typography.interface,
    fontWeight: typography.light,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.5 : (isFormValid ? 1 : 0.8),
    transition: transitions.normal,
    textTransform: 'none' as const,
    letterSpacing: '0.01em'
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
      {/* Modern Responsive Header - matching Layout component */}
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

          {/* Wedding Title - Dynamic Font Sizing */}
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

            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              style={{
                ...baseButtonStyle,
                fontFamily: typography.interface,
                minWidth: '44px' // Fixed minimum for touch target
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


      {/* Main content - optimized for viewport height */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: `${modernSpacing.xs} ${modernSpacing.base}`,
          minHeight: 0
        }}>

          {/* Welcome Title Section - Compact */}
          <div style={{
            textAlign: 'center',
            marginBottom: modernSpacing.xs,
            flexShrink: 0
          }}>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)',
              color: colors.deepOlive,
              ...minimalTypography.title,
              margin: 0
            }}>
              {t('auth.welcomeTitle')}
            </h3>
          </div>

          {/* Kea Image Section - Takes available space */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 0,
            marginBottom: '4px'
          }}>
            <img
              src="/images/kea.png"
              alt="Kea Island illustration"
              style={{
                maxHeight: 'calc(100% - 2rem)',
                maxWidth: 'min(320px, 80vw)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                opacity: 0.9
              }}
            />
          </div>

          {/* Form Section - Compact and fixed */}
          <div style={{
            maxWidth: '400px',
            width: '100%',
            margin: '0 auto',
            flexShrink: 0
          }}>

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(200, 100, 100, 0.1)',
              color: colors.deepOlive,
              padding: modernSpacing.xs,
              borderRadius: '8px',
              marginBottom: modernSpacing.xs,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              textAlign: 'center',
              border: '1px solid rgba(200, 100, 100, 0.2)',
              fontFamily: typography.interface,
              fontWeight: typography.light,
              opacity: 0.9
            }}>
              {error}
            </div>
          )}

          {/* Login form - Compact */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: modernSpacing.xs }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                color: colors.deepOlive,
                fontFamily: typography.interface,
                fontWeight: typography.light,
                opacity: 0.8
              }}>
                {language === 'fr' ? 'Prénom' : 'First Name'}
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 149, 109, 0.4)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 149, 109, 0.2)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'
                }}
                placeholder={language === 'fr' ? 'Votre prénom' : 'Your first name'}
              />
            </div>

            <div style={{ marginBottom: modernSpacing.base }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                color: colors.deepOlive,
                fontFamily: typography.interface,
                fontWeight: typography.light,
                opacity: 0.8
              }}>
                {language === 'fr' ? 'Nom de famille' : 'Last Name'}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 149, 109, 0.4)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 149, 109, 0.2)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'
                }}
                placeholder={language === 'fr' ? 'Votre nom de famille' : 'Your last name'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={buttonStyle}
              onMouseEnter={(e) => {
                if (!loading) {
                  if (isFormValid) {
                    e.currentTarget.style.background = colors.deepOlive
                    e.currentTarget.style.borderColor = colors.deepOlive
                  } else {
                    e.currentTarget.style.background = 'rgba(139, 149, 109, 0.3)'
                    e.currentTarget.style.color = colors.cream
                  }
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = isFormValid ? colors.oliveGreen : 'rgba(255, 255, 255, 0.4)'
                  e.currentTarget.style.color = isFormValid ? colors.cream : colors.deepOlive
                  e.currentTarget.style.borderColor = isFormValid ? colors.oliveGreen : 'rgba(139, 149, 109, 0.2)'
                  e.currentTarget.style.opacity = isFormValid ? '1' : '0.8'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>

          {/* Help text - Compact */}
          <div style={{
            textAlign: 'center',
            marginTop: modernSpacing.xs,
            fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
            color: colors.deepOlive,
            opacity: 0.7,
            fontFamily: typography.interface,
            fontWeight: typography.light,
            letterSpacing: '0.01em',
            lineHeight: 1.3
          }}>
            {t('auth.helpText')}
          </div>
          </div> {/* End Form Section */}
        </div> {/* End Content Container */}
      </main> {/* End Main content */}
    </div>
  )
}

export default LoginPage