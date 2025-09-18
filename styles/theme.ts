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
  error: '#A67C52',
  
  // RSVP Component Colors
  primary: '#8B956D', // Using oliveGreen as primary
  background: '#FBF9F4', // Using cream as background
  lightGray: '#F0F0F0',
  textSecondary: '#7A7A7A', // Using softGray for secondary text
  danger: '#C85450' // Red for 'No' responses
}

// Easy-to-change font for testing interfaces and interactive elements
const INTERFACE_FONT = "'Inter', 'Lato', sans-serif"

export const typography = {
  // Font families
  heading: "'Merriweather', serif",
  body: "'Lato', sans-serif",
  
  // Minimal design fonts
  title: "'Futura', 'Avenir Next', 'Century Gothic', 'Helvetica Neue', sans-serif",
  chat: "'Helvetica Neue', 'Gill Sans', 'Avenir', sans-serif",
  
  // Testing font for easy experimentation
  interface: INTERFACE_FONT,
  
  // Font weights
  thin: 100,
  extraLight: 200,
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
  strong: '0 8px 32px rgba(139, 149, 109, 0.2)',
  glass: '0 8px 32px rgba(139, 149, 109, 0.12)',
  floating: '0 10px 40px rgba(139, 149, 109, 0.15)',
  elevated: '0 20px 60px rgba(139, 149, 109, 0.18)'
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
  oliveSubtle: `linear-gradient(135deg, ${colors.sageGreen} 0%, ${colors.oliveGreen} 100%)`,
  glass: `linear-gradient(135deg, rgba(251, 249, 244, 0.25) 0%, rgba(245, 241, 232, 0.05) 100%)`,
  subtleWarmth: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmBeige} 50%, ${colors.stone} 100%)`,
  romanticOverlay: `linear-gradient(135deg, rgba(139, 149, 109, 0.03) 0%, rgba(164, 180, 148, 0.08) 100%)`
}

// Modern design tokens
export const transitions = {
  fast: '0.15s ease-out',
  normal: '0.25s ease-out',
  slow: '0.35s ease-out',
  spring: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
}

export const glassMorphism = {
  backdrop: 'blur(20px)',
  border: `1px solid rgba(139, 149, 109, 0.2)`,
  background: gradients.glass
}

// Enhanced spacing for modern layouts
export const modernSpacing = {
  ...spacing,
  xs: '0.25rem',
  tiny: '0.5rem',
  base: '1rem',
  comfortable: '1.5rem',
  spacious: '2.5rem',
  generous: '4rem'
}

// Paper texture background - uniform cream color
export const paperBackground = {
  // All screens - solid cream color
  primary: '#f8f6f0',

  // All screens - same solid cream color
  primaryLandscape: '#f8f6f0',

  // Subtle variant (keeping original for fallback)
  subtle: `
    radial-gradient(circle, transparent 2px, rgba(0,0,0,0.01) 2px),
    #f8f6f0
  `,

  // Background properties
  size: 'cover',
  repeat: 'no-repeat',
  position: 'center center',

  // Fallback
  fallback: '#f8f6f0'
}

// Minimal typography styles
export const minimalTypography = {
  title: {
    fontFamily: typography.title,
    fontWeight: typography.light,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    lineHeight: 1.2
  },
  chat: {
    fontFamily: typography.chat,
    fontWeight: typography.regular,
    letterSpacing: '0.01em',
    lineHeight: 1.5
  },
  interface: {
    fontFamily: typography.interface,
    fontWeight: typography.thin,
    letterSpacing: '0.01em',
    lineHeight: 1.5
  }
}