import { NextPage } from 'next'
import Layout from '../components/Layout'
import { useTranslation } from '../hooks/useTranslation'

const Transportation: NextPage = () => {
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
          {t('transportation.title')}
        </h1>

        {/* Getting to Location */}
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
            ✈️ {t('transportation.gettingThere.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.gettingThere.flight.title')}</strong>
              <p>{t('transportation.gettingThere.flight.airport')}</p>
              <p>{t('transportation.gettingThere.flight.time')}</p>
              <p>{t('transportation.gettingThere.flight.cost')}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.gettingThere.transfer.title')}</strong>
              <p>{t('transportation.gettingThere.transfer.route')}</p>
              <p>{t('transportation.gettingThere.transfer.time')}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.gettingThere.ferry.title')}</strong>
              <p>{t('transportation.gettingThere.ferry.route')}</p>
              <p>{t('transportation.gettingThere.ferry.time')}</p>
              <p>{t('transportation.gettingThere.ferry.cost')}</p>
            </div>
          </div>
        </div>

        {/* Parking */}
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
            🅿️ {t('transportation.parking.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.parking.official.title')}</strong>
              <p>{t('transportation.parking.official.location')}</p>
              <p>{t('transportation.parking.official.cost')}</p>
              <p>{t('transportation.parking.official.warning')}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.parking.alternative.title')}</strong>
              <p>{t('transportation.parking.alternative.location')}</p>
              <p>{t('transportation.parking.alternative.availability')}</p>
              <p>{t('transportation.parking.alternative.note')}</p>
            </div>
          </div>
        </div>

        {/* Shuttle Service */}
        <div style={{ 
          backgroundColor: '#e8f5e8',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            🚐 {t('transportation.shuttle.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <p><strong>{t('transportation.shuttle.description')}</strong></p>
            <p>📍 {t('transportation.shuttle.pickup')}</p>
            <p>🕐 {t('transportation.shuttle.departure')}</p>
            <p>🕘 {t('transportation.shuttle.return')}</p>
            <p>💰 {t('transportation.shuttle.cost')}</p>
            <p>{t('transportation.shuttle.rsvp')}</p>
          </div>
        </div>

        {/* From Airports */}
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '10px'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 6vw, 2rem)',
            marginBottom: '1.5rem',
            color: '#2c3e50'
          }}>
            ✈️ {t('transportation.airports.title')}
          </h2>
          <div style={{ 
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            lineHeight: '1.6',
            color: '#34495e'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.airports.cdg.title')}</strong>
              <p>{t('transportation.airports.cdg.route')}</p>
              <p>{t('transportation.airports.cdg.time')}</p>
              <p>{t('transportation.airports.cdg.cost')}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>{t('transportation.airports.orly.title')}</strong>
              <p>{t('transportation.airports.orly.route')}</p>
              <p>{t('transportation.airports.orly.time')}</p>
              <p>{t('transportation.airports.orly.cost')}</p>
            </div>
            <div>
              <strong>{t('transportation.airports.taxi.title')}</strong>
              <p>{t('transportation.airports.taxi.cdgCost')}</p>
              <p>{t('transportation.airports.taxi.orlyCost')}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Transportation