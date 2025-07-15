import { NextPage } from 'next'
import Layout from '../components/Layout'
import { useTranslation } from '../hooks/useTranslation'

const WeddingList: NextPage = () => {
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
          🎁 {t('weddingList.title')}
        </h1>

        {/* Main Message */}
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            💕 {t('weddingList.mainMessage.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p>{t('weddingList.mainMessage.description')}</p>
            <p>{t('weddingList.mainMessage.subtitle')}</p>
          </div>
        </div>

        {/* Registry Options */}
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
            🏺 {t('weddingList.registry.title')}
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
              marginBottom: '1rem',
              color: '#34495e'
            }}>
              {t('weddingList.registry.store1.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e',
              marginBottom: '1rem'
            }}>
              <p>Registry ID: <strong>{t('weddingList.registry.store1.registryId')}</strong></p>
              <p>
                <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ 
                    color: '#e74c3c', 
                    textDecoration: 'underline',
                    fontSize: '1.1rem'
                  }}>
                  View Registry →
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
              {t('weddingList.registry.store2.name')}
            </h3>
            <div style={{ 
              fontSize: 'clamp(1rem, 4vw, 1.1rem)',
              lineHeight: '1.6',
              color: '#34495e',
              marginBottom: '1rem'
            }}>
              <p>Registry ID: <strong>{t('weddingList.registry.store2.registryId')}</strong></p>
              <p>
                <a href="#" 
                  target="_blank" rel="noopener noreferrer" 
                  style={{ 
                    color: '#e74c3c', 
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
          backgroundColor: '#fff3cd',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            🏖️ {t('weddingList.honeymoon.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p>{t('weddingList.honeymoon.description')}</p>
            <p>{t('weddingList.honeymoon.details')}</p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              marginTop: '1.5rem'
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                marginBottom: '1rem',
                color: '#2c3e50'
              }}>
                {t('weddingList.honeymoon.contributeTitle')}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <strong>💳 {t('weddingList.honeymoon.honeymoonRegistry')}</strong>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                    honeyfund.com/lorem-ipsum-island
                  </a>
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
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

        {/* Charity Option */}
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
            ❤️ {t('weddingList.charity.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p>{t('weddingList.charity.description')}</p>
            
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>🐾 {t('weddingList.charity.animalShelter')}</strong>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                    {t('weddingList.charity.animalShelterName')}
                  </a>
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>🌱 {t('weddingList.charity.environment')}</strong>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                    {t('weddingList.charity.environmentName')}
                  </a>
                </p>
              </div>
              <div>
                <strong>🍎 {t('weddingList.charity.education')}</strong>
                <p>
                  <a href="#" 
                    target="_blank" rel="noopener noreferrer" 
                    style={{ color: '#e74c3c', textDecoration: 'underline' }}>
                    {t('weddingList.charity.educationName')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Note */}
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '2rem',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1rem',
            color: '#2c3e50'
          }}>
            🙏 {t('weddingList.thankYou.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p>{t('weddingList.thankYou.message')}</p>
            <p>{t('weddingList.thankYou.celebration')}</p>
            <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              {t('weddingList.thankYou.signature')}<br />
              {t('weddingList.thankYou.names')} 💕
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default WeddingList