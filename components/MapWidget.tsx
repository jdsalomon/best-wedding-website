import { useTranslation } from '../hooks/useTranslation'

interface MapWidgetProps {
  className?: string
}

const MapWidget = ({ className }: MapWidgetProps) => {
  const { t } = useTranslation()
  
  // Google Maps embed for Vourkari Village, Kea
  const googleMapsEmbed = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3158.259485706187!2d24.331233000000005!3d37.6666101!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a21992b89a05b5%3A0x60503c52c2d2fe5!2sVourkari%20Village!5e0!3m2!1sfr!2sgr!4v1752505787914!5m2!1sfr!2sgr"
  
  // Google Maps link for full view
  const googleMapsLink = "https://maps.app.goo.gl/6NSJatX5rzaCzRxG8"
  
  return (
    <div className={className}>
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '400px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #e9ecef'
      }}>
        <iframe
          src={googleMapsEmbed}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t('home.locationSection.venue')}
        />
      </div>
      
      {/* Map info below */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          color: '#34495e'
        }}>
          📍 <strong>{t('home.locationSection.venue')}</strong>
        </p>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
          color: '#666'
        }}>
          {t('home.locationSection.address')}
        </p>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
          color: '#666'
        }}>
          <a 
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#e74c3c',
              textDecoration: 'none'
            }}
          >
            🗺️ View on Google Maps
          </a>
        </p>
      </div>
    </div>
  )
}

export default MapWidget