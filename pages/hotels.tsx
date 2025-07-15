import { NextPage } from 'next'
import Layout from '../components/Layout'
import { useTranslation } from '../hooks/useTranslation'

const Hotels: NextPage = () => {
  const { t } = useTranslation()
  
  return (
    <Layout>
      <div>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 8vw, 3rem)',
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#2c3e50'
        }}>
          {t('hotels.title')}
        </h1>

        {/* Recommended Hotel */}
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          border: '2px solid #27ae60'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            ⭐ {t('hotels.recommended.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p><strong>{t('hotels.recommended.description')}</strong></p>
            <p>📍 {t('hotels.recommended.address')}</p>
            <p>🚶 {t('hotels.recommended.walkTime')}</p>
            <p>🚐 {t('hotels.recommended.shuttle')}</p>
            <p>💰 {t('hotels.recommended.price')}</p>
            <p>
              <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                target="_blank" rel="noopener noreferrer" 
                style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                lorem-palace.com
              </a>
            </p>
            <p style={{ 
              backgroundColor: '#d4edda', 
              padding: '1rem', 
              borderRadius: '5px',
              marginTop: '1rem'
            }}>
              💡 <strong>{t('hotels.recommended.groupRate')}</strong>
            </p>
          </div>
        </div>

        {/* Mid-Range Options */}
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            💰 {t('hotels.midRange.title')}
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
              marginBottom: '1rem',
              color: '#34495e'
            }}>
              {t('hotels.midRange.hotel1.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e'
            }}>
              <p>📍 {t('hotels.midRange.hotel1.address')}</p>
              <p>🚶 {t('hotels.midRange.hotel1.walkTime')}</p>
              <p>💰 {t('hotels.midRange.hotel1.price')}</p>
              <p>
                <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                  hotel-des-lorem.com
                </a>
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
              marginBottom: '1rem',
              color: '#34495e'
            }}>
              {t('hotels.midRange.hotel2.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e'
            }}>
              <p>📍 {t('hotels.midRange.hotel2.address')}</p>
              <p>🚶 {t('hotels.midRange.hotel2.walkTime')}</p>
              <p>💰 {t('hotels.midRange.hotel2.price')}</p>
              <p>
                <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                  bestwestern.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Budget Options */}
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            💵 {t('hotels.budget.title')}
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
              marginBottom: '1rem',
              color: '#34495e'
            }}>
              {t('hotels.budget.hotel1.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e'
            }}>
              <p>📍 {t('hotels.budget.hotel1.address')}</p>
              <p>🚶 {t('hotels.budget.hotel1.walkTime')}</p>
              <p>💰 {t('hotels.budget.hotel1.price')}</p>
              <p>
                <strong>{t('hotels.recommended.booking')}</strong> <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                  ibis.com
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
              marginBottom: '1rem',
              color: '#34495e'
            }}>
              {t('hotels.budget.airbnb.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e'
            }}>
              <p>💰 {t('hotels.budget.airbnb.price')}</p>
              <p>🏠 {t('hotels.budget.airbnb.description')}</p>
              <p>🔍 {t('hotels.budget.airbnb.search')}</p>
              <p>📍 {t('hotels.budget.airbnb.tip')}</p>
            </div>
          </div>
        </div>

        {/* Paris Options */}
        <div style={{ 
          backgroundColor: '#fff3cd',
          padding: '2rem',
          borderRadius: '10px'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            🗼 {t('hotels.paris.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p><strong>{t('hotels.paris.description')}</strong></p>
            <p>🚆 {t('hotels.paris.trainTime')}</p>
            <p>🎯 {t('hotels.paris.stayNear')}</p>
            <p>💡 {t('hotels.paris.recommendedAreas')}</p>
            <p>⚠️ {t('hotels.paris.lastTrain')}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Hotels