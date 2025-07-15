// Kea Island Design System - Colors and Theme
export const colors = {
  // Primary Colors
  warmBeige: '#F5F1E8',
  oliveGreen: '#8B956D',
  deepOlive: '#6B7353',
  sageGreen: '#A4B494',
  
  // Neutral Colors
  cream: '#FBF9F4',
  stone: '#E8E0D0',
  charcoal: '#3C3C3C',
  softGray: '#7A7A7A',
  
  // Functional Colors
  white: '#FFFFFF',
  success: '#7D8471',
  warning: '#B8A082',
  error: '#A67C52'
}

export const typography = {
  // Font families
  heading: "'Merriweather', serif",
  body: "'Lato', sans-serif",
  
  // Font weights
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
}

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  xxl: '4rem'
}

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '50%'
}

export const shadows = {
  soft: '0 2px 8px rgba(139, 149, 109, 0.1)',
  medium: '0 4px 16px rgba(139, 149, 109, 0.15)',
  strong: '0 8px 32px rgba(139, 149, 109, 0.2)'
}

// Component style helpers
export const cardStyle = {
  backgroundColor: colors.cream,
  borderRadius: borderRadius.lg,
  boxShadow: shadows.soft,
  border: `1px solid ${colors.stone}`,
  transition: 'all 0.3s ease'
}

export const buttonStyle = {
  backgroundColor: colors.oliveGreen,
  color: colors.cream,
  border: 'none',
  borderRadius: borderRadius.md,
  padding: `${spacing.sm} ${spacing.md}`,
  fontFamily: typography.body,
  fontWeight: typography.medium,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  ':hover': {
    backgroundColor: colors.deepOlive,
    transform: 'translateY(-1px)',
    boxShadow: shadows.medium
  }
}

export const gradients = {
  warmBackground: `linear-gradient(135deg, ${colors.warmBeige} 0%, ${colors.cream} 100%)`,
  oliveSubtle: `linear-gradient(135deg, ${colors.sageGreen} 0%, ${colors.oliveGreen} 100%)`
}