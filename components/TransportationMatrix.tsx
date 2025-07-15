import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { colors, typography, spacing, borderRadius } from '../styles/theme'
import transportationData from '../data/transportation.json'

interface TransportationStep {
  type: string
  from: string
  to: string
  airline?: string
  flightNumber?: string
  company?: string
  method?: string
  departure?: string
  arrival?: string
  duration: string
  cost: string
  notes: string
  location?: string
}

interface TransportationOption {
  id: string
  type: string
  totalDuration: string
  totalCost: string
  difficulty: 'easy' | 'medium' | 'hard'
  recommended: boolean
  steps: TransportationStep[]
}

interface DateRange {
  label: string
  options: TransportationOption[]
}

const TransportationMatrix = () => {
  const { t } = useTranslation()
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('')
  
  const matrix = transportationData.transportationMatrix
  const cities = Object.keys(matrix.departureCities)
  
  const getAvailableDateRanges = (cityKey: string) => {
    const routeKey = `${cityKey}_to_KEA`
    const route = matrix.routes[routeKey as keyof typeof matrix.routes]
    return route ? Object.keys(route.dateRanges) : []
  }
  
  const getTransportationOptions = (cityKey: string, dateRange: string): TransportationOption[] => {
    const routeKey = `${cityKey}_to_KEA`
    const route = matrix.routes[routeKey as keyof typeof matrix.routes]
    if (!route) return []
    
    const range = route.dateRanges[dateRange as keyof typeof route.dateRanges] as DateRange
    return range ? range.options : []
  }
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.sageGreen
      case 'medium': return colors.oliveGreen
      case 'hard': return colors.deepOlive
      default: return colors.charcoal
    }
  }
  
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️'
      case 'ferry': return '⛴️'
      case 'transfer': return '🚌'
      case 'overnight': return '🏨'
      default: return '📍'
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* City and Date Selection */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: spacing.md,
        marginBottom: spacing.xl
      }}>
        <div>
          <label style={{ 
            display: 'block',
            marginBottom: spacing.sm,
            fontWeight: typography.semibold,
            color: colors.deepOlive,
            fontFamily: typography.body
          }}>
            {t('transportation.matrix.selectCity')}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value)
              setSelectedDateRange('')
            }}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `2px solid ${colors.sageGreen}`,
              borderRadius: borderRadius.md,
              fontSize: '1rem',
              fontFamily: typography.body,
              backgroundColor: colors.cream,
              color: colors.charcoal
            }}
          >
            <option value="">{t('transportation.matrix.chooseDeparture')}</option>
            {cities.map(cityKey => (
              <option key={cityKey} value={cityKey}>
                {matrix.departureCities[cityKey as keyof typeof matrix.departureCities].name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedCity && (
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: spacing.sm,
              fontWeight: typography.semibold,
              color: colors.deepOlive,
              fontFamily: typography.body
            }}>
              {t('transportation.matrix.selectDate')}
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `2px solid ${colors.sageGreen}`,
                borderRadius: borderRadius.md,
                fontSize: '1rem',
                fontFamily: typography.body,
                backgroundColor: colors.cream,
                color: colors.charcoal
              }}
            >
              <option value="">{t('transportation.matrix.chooseDates')}</option>
              {getAvailableDateRanges(selectedCity).map(dateRange => {
                const routeKey = `${selectedCity}_to_KEA`
                const route = matrix.routes[routeKey as keyof typeof matrix.routes]
                const range = route?.dateRanges[dateRange as keyof typeof route.dateRanges] as DateRange
                return (
                  <option key={dateRange} value={dateRange}>
                    {range?.label || dateRange}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {/* Transportation Options */}
      {selectedCity && selectedDateRange && (
        <div style={{ marginTop: spacing.xl }}>
          <h3 style={{
            fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
            color: colors.deepOlive,
            marginBottom: spacing.lg,
            fontFamily: typography.heading,
            fontWeight: typography.semibold
          }}>
            {t('transportation.matrix.optionsTitle')}
          </h3>
          
          <div style={{ 
            display: 'grid',
            gap: spacing.lg,
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
          }}>
            {getTransportationOptions(selectedCity, selectedDateRange).map(option => (
              <div 
                key={option.id}
                style={{
                  backgroundColor: option.recommended ? colors.sageGreen : colors.cream,
                  padding: spacing.lg,
                  borderRadius: borderRadius.lg,
                  border: option.recommended ? `2px solid ${colors.deepOlive}` : `1px solid ${colors.sageGreen}`,
                  position: 'relative'
                }}
              >
                {option.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: spacing.md,
                    backgroundColor: colors.deepOlive,
                    color: colors.cream,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.sm,
                    fontSize: '0.8rem',
                    fontWeight: typography.bold
                  }}>
                    ⭐ {t('transportation.matrix.recommended')}
                  </div>
                )}
                
                {/* Option Header */}
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{
                      backgroundColor: getDifficultyColor(option.difficulty),
                      color: colors.cream,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.sm,
                      fontSize: '0.9rem',
                      fontWeight: typography.medium
                    }}>
                      {option.difficulty.toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: typography.bold,
                      color: option.recommended ? colors.cream : colors.deepOlive
                    }}>
                      {option.totalCost}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: option.recommended ? colors.cream : colors.charcoal,
                    opacity: 0.8
                  }}>
                    {t('transportation.matrix.totalTime')}: {option.totalDuration}
                  </div>
                </div>

                {/* Steps */}
                <div style={{ marginTop: spacing.md }}>
                  {option.steps.map((step, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: spacing.md,
                        paddingBottom: spacing.md,
                        borderBottom: index < option.steps.length - 1 ? 
                          `1px solid ${option.recommended ? colors.deepOlive : colors.sageGreen}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: '1.5rem',
                        marginRight: spacing.md,
                        minWidth: '2rem'
                      }}>
                        {getStepIcon(step.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: typography.semibold,
                          color: option.recommended ? colors.cream : colors.deepOlive,
                          marginBottom: spacing.xs
                        }}>
                          {step.from} → {step.to}
                        </div>
                        
                        <div style={{
                          fontSize: '0.9rem',
                          color: option.recommended ? colors.cream : colors.charcoal,
                          marginBottom: spacing.xs
                        }}>
                          {step.airline && `${step.airline} ${step.flightNumber}`}
                          {step.company && step.company}
                          {step.method && step.method}
                          {step.location && `Stay in ${step.location}`}
                        </div>
                        
                        <div style={{
                          fontSize: '0.8rem',
                          color: option.recommended ? colors.cream : colors.charcoal,
                          opacity: 0.9
                        }}>
                          {step.departure && step.arrival && `${step.departure} - ${step.arrival}`}
                          {step.duration && ` • ${step.duration}`}
                          {step.cost && ` • ${step.cost}`}
                        </div>
                        
                        {step.notes && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: option.recommended ? colors.cream : colors.softGray,
                            marginTop: spacing.xs,
                            fontStyle: 'italic'
                          }}>
                            {step.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Info */}
      <div style={{ 
        marginTop: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.warmBeige,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.sageGreen}`
      }}>
        <h3 style={{
          fontSize: 'clamp(1.2rem, 3vw, 1.4rem)',
          color: colors.deepOlive,
          marginBottom: spacing.md,
          fontFamily: typography.heading,
          fontWeight: typography.semibold
        }}>
          {t('transportation.matrix.additionalInfo')}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.md
        }}>
          <div>
            <h4 style={{
              fontSize: '1rem',
              color: colors.oliveGreen,
              marginBottom: spacing.sm,
              fontWeight: typography.medium
            }}>
              🚐 {t('transportation.matrix.shuttleService')}
            </h4>
            <p style={{
              fontSize: '0.9rem',
              color: colors.charcoal,
              marginBottom: spacing.xs
            }}>
              {matrix.generalInfo.shuttle.cost}
            </p>
            <p style={{
              fontSize: '0.8rem',
              color: colors.softGray
            }}>
              {matrix.generalInfo.shuttle.pickup} → {matrix.generalInfo.shuttle.dropoff}
            </p>
          </div>
          
          <div>
            <h4 style={{
              fontSize: '1rem',
              color: colors.oliveGreen,
              marginBottom: spacing.sm,
              fontWeight: typography.medium
            }}>
              🚗 {t('transportation.matrix.localTransport')}
            </h4>
            <p style={{
              fontSize: '0.9rem',
              color: colors.charcoal,
              marginBottom: spacing.xs
            }}>
              {t('transportation.matrix.taxi')}: {matrix.generalInfo.localTransport.taxi.cost}
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: colors.charcoal
            }}>
              {t('transportation.matrix.carRental')}: {matrix.generalInfo.localTransport.carRental.cost}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransportationMatrix