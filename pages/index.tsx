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
                <div style={{ marginBottom: spacing.md }}>
                  <strong style={{ color: colors.deepOlive }}>
                    {t('home.program.day4.cinema.time')}
                  </strong> - {t('home.program.day4.cinema.event')} @ {t('home.program.day4.cinema.location')}
                  <div style={{ 
                    fontSize: '0.9em', 
                    color: colors.softGray, 
                    marginTop: spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    {t('home.program.day4.cinema.description')}
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

        <OliveBranch variant="natural1" size="medium" />

        {/* Transportation Section */}
        <div id="transportation" style={{ 
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
            {t('transportation.title')}
          </h2>

          {/* Getting to Location */}
          <div style={{ 
            backgroundColor: colors.warmBeige,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            border: `2px solid ${colors.sageGreen}`
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.oliveGreen,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              ✈️ {t('transportation.gettingThere.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.charcoal,
              fontFamily: typography.body
            }}>
              <div style={{ marginBottom: spacing.md }}>
                <strong style={{ color: colors.deepOlive }}>{t('transportation.gettingThere.flight.title')}</strong>
                <p>{t('transportation.gettingThere.flight.airport')}</p>
                <p>{t('transportation.gettingThere.flight.time')}</p>
                <p>{t('transportation.gettingThere.flight.cost')}</p>
              </div>
              <div style={{ marginBottom: spacing.md }}>
                <strong style={{ color: colors.deepOlive }}>{t('transportation.gettingThere.transfer.title')}</strong>
                <p>{t('transportation.gettingThere.transfer.route')}</p>
                <p>{t('transportation.gettingThere.transfer.time')}</p>
              </div>
              <div style={{ marginBottom: spacing.md }}>
                <strong style={{ color: colors.deepOlive }}>{t('transportation.gettingThere.ferry.title')}</strong>
                <p>{t('transportation.gettingThere.ferry.route')}</p>
                <p>{t('transportation.gettingThere.ferry.time')}</p>
                <p>{t('transportation.gettingThere.ferry.cost')}</p>
              </div>
            </div>
          </div>

          {/* Parking */}
          <div style={{ 
            backgroundColor: colors.cream,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.oliveGreen,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              🅿️ {t('transportation.parking.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.charcoal,
              fontFamily: typography.body
            }}>
              <div style={{ marginBottom: spacing.md }}>
                <strong style={{ color: colors.deepOlive }}>{t('transportation.parking.official.title')}</strong>
                <p>{t('transportation.parking.official.location')}</p>
                <p>{t('transportation.parking.official.cost')}</p>
                <p>{t('transportation.parking.official.warning')}</p>
              </div>
              <div style={{ marginBottom: spacing.md }}>
                <strong style={{ color: colors.deepOlive }}>{t('transportation.parking.alternative.title')}</strong>
                <p>{t('transportation.parking.alternative.location')}</p>
                <p>{t('transportation.parking.alternative.availability')}</p>
                <p>{t('transportation.parking.alternative.note')}</p>
              </div>
            </div>
          </div>

          {/* Shuttle Service */}
          <div style={{ 
            backgroundColor: colors.sageGreen,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.cream,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              🚐 {t('transportation.shuttle.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.cream,
              fontFamily: typography.body
            }}>
              <p><strong>{t('transportation.shuttle.description')}</strong></p>
              <p>📍 {t('transportation.shuttle.pickup')}</p>
              <p>🕐 {t('transportation.shuttle.departure')}</p>
              <p>🕘 {t('transportation.shuttle.return')}</p>
              <p>💰 {t('transportation.shuttle.cost')}</p>
              <p>{t('transportation.shuttle.rsvp')}</p>
            </div>
          </div>
        </div>

        <OliveBranch variant="natural2" size="medium" />

        {/* Hotels Section */}
        <div id="hotels" style={{ 
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
            {t('hotels.title')}
          </h2>

          {/* Recommended Hotel */}
          <div style={{ 
            backgroundColor: colors.sageGreen,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            border: `2px solid ${colors.deepOlive}`
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.cream,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              ⭐ {t('hotels.recommended.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.cream,
              fontFamily: typography.body
            }}>
              <p><strong>{t('hotels.recommended.description')}</strong></p>
              <p>📍 {t('hotels.recommended.address')}</p>
              <p>🚶 {t('hotels.recommended.walkTime')}</p>
              <p>🚐 {t('hotels.recommended.shuttle')}</p>
              <p>💰 {t('hotels.recommended.price')}</p>
              <p>
                <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ color: colors.cream, textDecoration: 'underline' }}>
                  lorem-palace.com
                </a>
              </p>
              <p style={{ 
                backgroundColor: colors.warmBeige, 
                padding: spacing.md, 
                borderRadius: borderRadius.md,
                marginTop: spacing.md,
                color: colors.charcoal
              }}>
                💡 <strong>{t('hotels.recommended.groupRate')}</strong>
              </p>
            </div>
          </div>

          {/* Mid-Range Options */}
          <div style={{ 
            backgroundColor: colors.cream,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.oliveGreen,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              💰 {t('hotels.midRange.title')}
            </h3>
            
            <div style={{ marginBottom: spacing.lg }}>
              <h4 style={{ 
                fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                marginBottom: spacing.sm,
                color: colors.deepOlive,
                fontFamily: typography.heading,
                fontWeight: typography.medium
              }}>
                {t('hotels.midRange.hotel1.name')}
              </h4>
              <div style={{ 
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                lineHeight: '1.8',
                color: colors.charcoal,
                fontFamily: typography.body
              }}>
                <p>📍 {t('hotels.midRange.hotel1.address')}</p>
                <p>🚶 {t('hotels.midRange.hotel1.walkTime')}</p>
                <p>💰 {t('hotels.midRange.hotel1.price')}</p>
                <p>
                  <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: colors.deepOlive, textDecoration: 'underline' }}>
                    hotel-des-lorem.com
                  </a>
                </p>
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <h4 style={{ 
                fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                marginBottom: spacing.sm,
                color: colors.deepOlive,
                fontFamily: typography.heading,
                fontWeight: typography.medium
              }}>
                {t('hotels.midRange.hotel2.name')}
              </h4>
              <div style={{ 
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                lineHeight: '1.8',
                color: colors.charcoal,
                fontFamily: typography.body
              }}>
                <p>📍 {t('hotels.midRange.hotel2.address')}</p>
                <p>🚶 {t('hotels.midRange.hotel2.walkTime')}</p>
                <p>💰 {t('hotels.midRange.hotel2.price')}</p>
                <p>
                  <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: colors.deepOlive, textDecoration: 'underline' }}>
                    bestwestern.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <OliveBranch variant="natural1" size="medium" />

        {/* Wedding List Section */}
        <div id="wedding-list" style={{ 
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
            {t('weddingList.title')}
          </h2>

          {/* Main Message */}
          <div style={{ 
            backgroundColor: colors.sageGreen,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.cream,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              💕 {t('weddingList.mainMessage.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.cream,
              fontFamily: typography.body
            }}>
              <p>{t('weddingList.mainMessage.description')}</p>
              <p>{t('weddingList.mainMessage.subtitle')}</p>
            </div>
          </div>

          {/* Registry Options */}
          <div style={{ 
            backgroundColor: colors.cream,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.oliveGreen,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              🏺 {t('weddingList.registry.title')}
            </h3>
            
            <div style={{ marginBottom: spacing.lg }}>
              <h4 style={{ 
                fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                marginBottom: spacing.sm,
                color: colors.deepOlive,
                fontFamily: typography.heading,
                fontWeight: typography.medium
              }}>
                {t('weddingList.registry.store1.name')}
              </h4>
              <div style={{ 
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                lineHeight: '1.8',
                color: colors.charcoal,
                fontFamily: typography.body,
                marginBottom: spacing.md
              }}>
                <p>Registry ID: <strong>{t('weddingList.registry.store1.registryId')}</strong></p>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ 
                      color: colors.deepOlive, 
                      textDecoration: 'underline',
                      fontSize: '1.1rem'
                    }}>
                    View Registry →
                  </a>
                </p>
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <h4 style={{ 
                fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                marginBottom: spacing.sm,
                color: colors.deepOlive,
                fontFamily: typography.heading,
                fontWeight: typography.medium
              }}>
                {t('weddingList.registry.store2.name')}
              </h4>
              <div style={{ 
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                lineHeight: '1.8',
                color: colors.charcoal,
                fontFamily: typography.body,
                marginBottom: spacing.md
              }}>
                <p>Registry ID: <strong>{t('weddingList.registry.store2.registryId')}</strong></p>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ 
                      color: colors.deepOlive, 
                      textDecoration: 'underline',
                      fontSize: '1.1rem'
                    }}>
                    View Registry →
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Honeymoon Fund */}
          <div style={{ 
            backgroundColor: colors.warmBeige,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.oliveGreen,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              🏖️ {t('weddingList.honeymoon.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.charcoal,
              fontFamily: typography.body
            }}>
              <p>{t('weddingList.honeymoon.description')}</p>
              <p>{t('weddingList.honeymoon.details')}</p>
              
              <div style={{ 
                backgroundColor: colors.cream,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                marginTop: spacing.md
              }}>
                <h4 style={{ 
                  fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                  marginBottom: spacing.sm,
                  color: colors.deepOlive,
                  fontFamily: typography.heading,
                  fontWeight: typography.medium
                }}>
                  {t('weddingList.honeymoon.contributeTitle')}
                </h4>
                <div style={{ marginBottom: spacing.sm }}>
                  <strong>💳 {t('weddingList.honeymoon.honeymoonRegistry')}</strong>
                  <p>
                    <a href="#" 
                      target="_blank" rel="noopener noreferrer" 
                      style={{ color: colors.deepOlive, textDecoration: 'underline' }}>
                      honeyfund.com/lorem-ipsum-island
                    </a>
                  </p>
                </div>
                <div style={{ marginBottom: spacing.sm }}>
                  <strong>🏦 {t('weddingList.honeymoon.bankTransfer')}</strong>
                  <p>{t('weddingList.honeymoon.bankTransferDetails')}</p>
                </div>
                <div>
                  <strong>💌 {t('weddingList.honeymoon.cashCheck')}</strong>
                  <p>{t('weddingList.honeymoon.cashCheckDetails')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Note */}
          <div style={{ 
            backgroundColor: colors.sageGreen,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              color: colors.cream,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontWeight: typography.semibold
            }}>
              🙏 {t('weddingList.thankYou.title')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.2rem)',
              lineHeight: '1.8',
              color: colors.cream,
              fontFamily: typography.body
            }}>
              <p>{t('weddingList.thankYou.message')}</p>
              <p>{t('weddingList.thankYou.celebration')}</p>
              <p style={{ marginTop: spacing.md, fontStyle: 'italic' }}>
                {t('weddingList.thankYou.signature')}<br />
                {t('weddingList.thankYou.names')} 💕
              </p>
            </div>
          </div>
        </div>
        {/* End of hidden sections */}
      </div>
    </Layout>
  )
}

export default Home