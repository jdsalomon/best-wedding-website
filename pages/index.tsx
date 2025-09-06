import { NextPage } from 'next'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import MapWidget from '../components/MapWidget'
import OliveBranch from '../components/OliveBranch'
import ChatBar from '../components/ChatBar'
import InlineChatInterface from '../components/InlineChatInterface'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, cardStyle, spacing, borderRadius, shadows, transitions, modernSpacing, gradients } from '../styles/theme'

const Home: NextPage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const { language } = useLanguageContext()
  const [isInlineChatOpen, setIsInlineChatOpen] = useState(false)
  const [firstMessage, setFirstMessage] = useState<string>('')
  
  const handleFirstMessage = (message: string) => {
    setFirstMessage(message)
    setIsInlineChatOpen(true)
  }
  
  return (
    <Layout>
      {/* Modern Full-Screen Chat Layout */}
      <div style={{ 
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Full-Screen Chat Interface or Login Prompt */}
        <div style={{ 
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading ? (
            // Modern Loading state
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: gradients.romanticOverlay,
              flexDirection: 'column',
              gap: modernSpacing.base
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${colors.sageGreen}`,
                borderTop: `3px solid ${colors.oliveGreen}`,
                borderRadius: '50%'
              }} />
              <div style={{
                color: colors.deepOlive,
                fontSize: '1.1rem',
                fontFamily: typography.body,
                fontWeight: typography.medium
              }}>
                {language === 'fr' ? 'Chargement...' : 'Loading...'}
              </div>
            </div>
          ) : isAuthenticated ? (
            // Authenticated - show chat interface
            <InlineChatInterface
              isOpen={true}
              onClose={() => {}}
              firstMessage=""
            />
          ) : (
            // Clean login prompt
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: modernSpacing.spacious,
              textAlign: 'center',
              background: gradients.subtleWarmth
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                padding: `${modernSpacing.generous} ${modernSpacing.spacious}`,
                borderRadius: '24px',
                border: `1px solid rgba(139, 149, 109, 0.2)`,
                boxShadow: shadows.floating,
                maxWidth: '480px',
                width: '100%',
                position: 'relative'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
                  color: colors.deepOlive,
                  marginBottom: modernSpacing.comfortable,
                  fontFamily: typography.heading,
                  fontWeight: typography.bold,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  {t('auth.homeTitle')}
                </h2>
                <p style={{
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                  color: colors.charcoal,
                  marginBottom: modernSpacing.generous,
                  fontFamily: typography.body,
                  lineHeight: 1.6,
                  opacity: 0.9
                }}>
                  {t('auth.homeMessage')}
                </p>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    background: gradients.oliveSubtle,
                    color: colors.cream,
                    border: 'none',
                    borderRadius: '16px',
                    padding: `${modernSpacing.comfortable} ${modernSpacing.spacious}`,
                    fontSize: 'clamp(1rem, 3vw, 1.1rem)',
                    fontFamily: typography.body,
                    fontWeight: typography.semibold,
                    cursor: 'pointer',
                    transition: transitions.spring,
                    width: '100%',
                    boxShadow: shadows.medium,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                    e.currentTarget.style.boxShadow = shadows.elevated
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = shadows.medium
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {language === 'fr' ? 'Se Connecter' : 'Sign In'}
                  </span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
      
      {/* HIDDEN SECTIONS - All original content preserved but not displayed */}
      <div style={{ display: 'none' }}>
          {/* Original Chat Components */}
          {!isInlineChatOpen && (
            <ChatBar onSendMessage={handleFirstMessage} />
          )}
          
          <InlineChatInterface
            isOpen={isInlineChatOpen}
            onClose={() => setIsInlineChatOpen(false)}
            firstMessage={firstMessage}
          />

          {/* Program Section */}
        <div id="program" style={{ 
          ...cardStyle,
          padding: spacing.xl,
          textAlign: 'left',
          position: 'relative'
        }}>
          <OliveBranch variant="corner" size="small" />
          <h2 style={{ 
            fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
            marginBottom: spacing.xl,
            color: colors.deepOlive,
            textAlign: 'center',
            fontFamily: typography.heading,
            fontWeight: typography.bold
          }}>
            {t('home.program.title')}
          </h2>
          
          {process.env.SHOW_PROGRAM === 'true' ? (
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.charcoal,
              fontFamily: typography.body
            }}>
              {/* Day 1 */}
              <div style={{ marginBottom: spacing.xl }}>
                <h3 style={{ 
                  fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                  color: colors.oliveGreen,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontWeight: typography.semibold
                }}>
                  {t('home.program.day1.date')}
                </h3>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day1.civil.time')}
                  </strong> - {t('home.program.day1.civil.event')} @ {t('home.program.day1.civil.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day1.civil.special')}
                  </div>
                </div>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day1.shabbat.time')}
                  </strong> - {t('home.program.day1.shabbat.event')} @ {t('home.program.day1.shabbat.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day1.shabbat.description')}
                  </div>
                </div>
              </div>

              {/* Day 2 */}
              <div style={{ marginBottom: spacing.xl }}>
                <h3 style={{ 
                  fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                  color: colors.oliveGreen,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontWeight: typography.semibold
                }}>
                  {t('home.program.day2.date')}
                </h3>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day2.relaxation.time')}
                  </strong> - {t('home.program.day2.relaxation.event')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day2.relaxation.description')}
                  </div>
                </div>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day2.welcome.time')}
                  </strong> - {t('home.program.day2.welcome.event')} @ {t('home.program.day2.welcome.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day2.welcome.description')}
                  </div>
                </div>
              </div>

              {/* Day 3 */}
              <div style={{ marginBottom: spacing.xl }}>
                <h3 style={{ 
                  fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                  color: colors.oliveGreen,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontWeight: typography.semibold
                }}>
                  {t('home.program.day3.date')}
                </h3>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day3.ceremony.time')}
                  </strong> - {t('home.program.day3.ceremony.event')} @ {t('home.program.day3.ceremony.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day3.ceremony.description')}
                  </div>
                </div>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day3.party.time')}
                  </strong> - {t('home.program.day3.party.event')} @ {t('home.program.day3.party.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day3.party.description')}
                  </div>
                </div>
              </div>

              {/* Day 4 */}
              <div style={{ marginBottom: spacing.md }}>
                <h3 style={{ 
                  fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                  color: colors.oliveGreen,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontWeight: typography.semibold
                }}>
                  {t('home.program.day4.date')}
                </h3>
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day4.beach.time')}
                  </strong> - {t('home.program.day4.beach.event')} @ {t('home.program.day4.beach.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day4.beach.description')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.charcoal,
              textAlign: 'center',
              padding: spacing.xl,
              fontFamily: typography.body,
              fontStyle: 'italic'
            }}>
              {t('home.program.tba')}
            </div>
          )}
        </div>



      </div>
    </Layout>
  )
}

export default Home