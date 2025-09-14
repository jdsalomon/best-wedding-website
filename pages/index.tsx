import { NextPage } from 'next'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import MapWidget from '../components/MapWidget'
import OliveBranch from '../components/OliveBranch'
import ChatBar from '../components/ChatBar'
import InlineChatInterface from '../components/InlineChatInterface'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import { useLanguageContext } from '../contexts/LanguageContext'
import { colors, typography, cardStyle, spacing, borderRadius, shadows, transitions, modernSpacing, gradients, paperBackground, minimalTypography } from '../styles/theme'

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

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
              background: 'transparent',
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
            // Redirect to login - no welcome page needed
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'transparent',
              flexDirection: 'column',
              gap: modernSpacing.base
            }}>
              <div style={{
                color: colors.deepOlive,
                fontSize: '1.1rem',
                fontFamily: typography.interface,
                fontWeight: typography.light
              }}>
                {language === 'fr' ? 'Redirection...' : 'Redirecting...'}
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