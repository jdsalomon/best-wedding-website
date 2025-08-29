import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguageContext } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { colors, typography, gradients, spacing, borderRadius, shadows } from '../styles/theme'

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

  const inputStyle = {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${colors.softGray}`,
    borderRadius: borderRadius.md,
    fontSize: '1rem',
    fontFamily: typography.body,
    backgroundColor: colors.white,
    color: colors.charcoal,
    outline: 'none' as const,
    transition: 'all 0.3s ease'
  }

  const buttonStyle = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.oliveGreen,
    color: colors.warmBeige,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: '1rem',
    fontFamily: typography.body,
    fontWeight: typography.semibold,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'all 0.3s ease'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: typography.body,
      background: gradients.warmBackground,
      color: colors.charcoal,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Language switcher header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: spacing.md 
      }}>
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

      {/* Main login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md
      }}>
        <div style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          boxShadow: shadows.soft,
          padding: `${spacing.xl} ${spacing.lg}`,
          maxWidth: '400px',
          width: '100%'
        }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            <h1 style={{
              fontFamily: typography.heading,
              fontSize: '2rem',
              color: colors.oliveGreen,
              margin: `0 0 ${spacing.sm} 0`
            }}>
              {t('auth.welcomeTitle')}
            </h1>
            <p style={{
              fontFamily: typography.body,
              color: colors.charcoal,
              margin: 0,
              opacity: 0.8
            }}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.md }}>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: '0.9rem',
                color: colors.charcoal,
                fontWeight: typography.medium
              }}>
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.oliveGreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.softGray
                }}
                placeholder="Entrez votre prénom"
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: '0.9rem',
                color: colors.charcoal,
                fontWeight: typography.medium
              }}>
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.oliveGreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.softGray
                }}
                placeholder="Entrez votre nom"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={buttonStyle}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = colors.charcoal
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = colors.oliveGreen
                }
              }}
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>

          {/* Help text */}
          <div style={{
            textAlign: 'center',
            marginTop: spacing.md,
            fontSize: '0.8rem',
            color: colors.charcoal,
            opacity: 0.6
          }}>
            {t('auth.helpText')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage