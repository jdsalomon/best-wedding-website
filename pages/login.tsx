import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
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

  // Check screen orientation and mobile status
  useEffect(() => {
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
      minHeight: '100vh',
      fontFamily: typography.interface,
      background: paperBackground.primary,
      color: colors.charcoal,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Wedding Header */}
      <header style={{
        flexShrink: 0,
        zIndex: 1000,
        background: 'transparent',
        border: 'none'
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

          {/* Wedding Info */}
          <div style={{
            flex: 1,
            minWidth: 0,
            maxWidth: 'calc(100% - 100px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(3px, 3.5vw, 15px)',
              ...minimalTypography.title,
              color: colors.deepOlive,
              textShadow: '0 1px 2px rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'clip'
            }}>
              {t('home.weddingLineMobile')}
            </h1>
          </div>

          {/* Language switcher */}
          <button
            onClick={toggleLanguage}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: `1px solid rgba(60, 60, 60, 0.2)`,
              borderRadius: borderRadius.sm,
              padding: isMobile ? `${modernSpacing.tiny} ${modernSpacing.xs}` : `${modernSpacing.xs} ${modernSpacing.base}`,
              cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: colors.charcoal,
              fontFamily: typography.interface,
              fontWeight: typography.light,
              transition: transitions.normal,
              whiteSpace: 'nowrap',
              minWidth: isMobile ? '32px' : 'auto'
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
        </div>
      </header>


      {/* Main login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: modernSpacing.base
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%'
        }}>
          {/* Login Title */}
          <div style={{ textAlign: 'center', marginBottom: modernSpacing.generous, marginTop: modernSpacing.comfortable }}>
            <h1 style={{
              fontFamily: typography.interface,
              fontSize: 'clamp(1rem, 3vw, 1.3rem)',
              color: colors.deepOlive,
              fontWeight: typography.light,
              textTransform: 'none',
              letterSpacing: '0.01em',
              lineHeight: 1.2,
              margin: `0 0 ${modernSpacing.tiny} 0`
            }}>
              {t('auth.welcomeTitle')}
            </h1>
            <p style={{
              fontFamily: typography.interface,
              fontSize: 'clamp(1rem, 3vw, 1.3rem)',
              color: colors.deepOlive,
              fontWeight: typography.light,
              margin: 0,
              opacity: 0.8,
              letterSpacing: '0.01em',
              lineHeight: 1.4
            }}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(200, 100, 100, 0.1)',
              color: colors.deepOlive,
              padding: modernSpacing.comfortable,
              borderRadius: '12px',
              marginBottom: modernSpacing.comfortable,
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              textAlign: 'center',
              border: '1px solid rgba(200, 100, 100, 0.2)',
              fontFamily: typography.interface,
              fontWeight: typography.light,
              opacity: 0.9
            }}>
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: modernSpacing.comfortable }}>
              <label style={{
                display: 'block',
                marginBottom: modernSpacing.tiny,
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
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

            <div style={{ marginBottom: modernSpacing.generous }}>
              <label style={{
                display: 'block',
                marginBottom: modernSpacing.tiny,
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
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

          {/* Help text */}
          <div style={{
            textAlign: 'center',
            marginTop: modernSpacing.comfortable,
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
            color: colors.deepOlive,
            opacity: 0.7,
            fontFamily: typography.interface,
            fontWeight: typography.light,
            letterSpacing: '0.01em',
            lineHeight: 1.4
          }}>
            {t('auth.helpText')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage