import { colors, transitions, shadows } from '../styles/theme'

interface OliveBranchProps {
  variant?: 'horizontal' | 'vertical' | 'corner' | 'natural1' | 'natural2'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const OliveBranch = ({ variant = 'horizontal', size = 'medium', className }: OliveBranchProps) => {
  const getSvgDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 60 }
      case 'large':
        return { width: 200, height: 100 }
      default:
        return { width: 160, height: 80 }
    }
  }

  const { width, height } = getSvgDimensions()

  if (variant === 'horizontal' || variant === 'natural1') {
    return (
      <div className={className} style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '3rem 0',
        opacity: 0.6,
        position: 'relative'
      }}>
        <div style={{
          filter: `drop-shadow(0 2px 8px rgba(139, 149, 109, 0.15))`,
          transition: transitions.slow,
          transform: 'translateY(0)'
        }}>
          <svg width={width} height={height} viewBox="0 0 145 78" fill="none">
            {/* Enhanced leaves with gradient effect */}
            <defs>
              <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.sageGreen} />
                <stop offset="100%" stopColor={colors.oliveGreen} />
              </linearGradient>
              <linearGradient id="branchGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.deepOlive} />
                <stop offset="100%" stopColor={colors.charcoal} />
              </linearGradient>
            </defs>
            
            <path
              d="M 125,21 C 133.332,17.4017 138.004,10.8076 140,2 C 131.768,4.80043 126.623,12.7823 125,21 M 121,9 C 115.423,14.8743 109.344,21.3927 111,30 C 116.736,25.9224 123.654,16.4819 121,9 M 105,17 C 99.4877,23.3758 96.0764,29.4521 96,38 C 102.695,34.4163 108.138,24.5495 105,17 M 91,22 C 86.9367,28.7251 80.7286,35.7187 83,44 C 89.5693,39.9945 94.1158,29.4955 91,22 z"
              fill="url(#leafGradient1)"
              stroke="none"
            />
            
            <path
              d="M 123,22 C 111.924,33.0683 94.8436,47.1444 78,46 C 73.0981,49.7183 64.0415,49.1726 58,50 C 37.7062,52.7794 14.2794,52.3969 4,74 C 12.8131,73.2993 18.6752,60.2677 28,57.3897 C 53.2896,49.5842 80.3415,54.3855 104,40.1998 C 109.807,36.718 123.162,29.6358 123,22 z"
              fill="url(#branchGradient1)"
              stroke="none"
            />
            
            <path
              d="M 120,32 C 128.488,31.8239 135.85,28.9759 141,22 C 132.506,22.1753 124.21,23.9759 120,32 M 110,41 C 117.984,43.968 124.524,41.0661 132,38 C 125.775,33.747 114.666,35.2613 110,41 M 93,46 C 95.8923,54.6746 110.783,52.29 118,52 L 115,46 L 93,46 z"
              fill="url(#leafGradient1)"
              stroke="none"
            />
          </svg>
        </div>
        
      </div>
    )
  }

  if (variant === 'natural2') {
    return (
      <div className={className} style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '2rem 0',
        opacity: 0.7,
        transform: 'scaleX(-1)'
      }}>
        <svg width={width} height={height} viewBox="0 0 145 78" fill="none">
          {/* Mirrored version - same paths with different colors */}
          <path
            d="M 125,21 C 133.332,17.4017 138.004,10.8076 140,2 C 131.768,4.80043 126.623,12.7823 125,21 M 121,9 C 115.423,14.8743 109.344,21.3927 111,30 C 116.736,25.9224 123.654,16.4819 121,9 M 105,17 C 99.4877,23.3758 96.0764,29.4521 96,38 C 102.695,34.4163 108.138,24.5495 105,17 M 91,22 C 86.9367,28.7251 80.7286,35.7187 83,44 C 89.5693,39.9945 94.1158,29.4955 91,22 z"
            fill={colors.sageGreen}
            stroke="none"
          />
          
          <path
            d="M 123,22 C 111.924,33.0683 94.8436,47.1444 78,46 C 73.0981,49.7183 64.0415,49.1726 58,50 C 37.7062,52.7794 14.2794,52.3969 4,74 C 12.8131,73.2993 18.6752,60.2677 28,57.3897 C 53.2896,49.5842 80.3415,54.3855 104,40.1998 C 109.807,36.718 123.162,29.6358 123,22 z"
            fill={colors.deepOlive}
            stroke="none"
          />
          
          <path
            d="M 120,32 C 128.488,31.8239 135.85,28.9759 141,22 C 132.506,22.1753 124.21,23.9759 120,32 M 110,41 C 117.984,43.968 124.524,41.0661 132,38 C 125.775,33.747 114.666,35.2613 110,41 M 93,46 C 95.8923,54.6746 110.783,52.29 118,52 L 115,46 L 93,46 z"
            fill={colors.sageGreen}
            stroke="none"
          />
        </svg>
      </div>
    )
  }

  if (variant === 'corner') {
    return (
      <div className={className} style={{ 
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        opacity: 0.3,
        pointerEvents: 'none'
      }}>
        <div style={{
          filter: `drop-shadow(0 1px 4px rgba(139, 149, 109, 0.2))`,
          transition: transitions.slow
        }}>
          <svg width={80} height={43} viewBox="0 0 145 78" fill="none">
            <defs>
              <linearGradient id="leafGradientCorner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.sageGreen} />
                <stop offset="100%" stopColor={colors.oliveGreen} />
              </linearGradient>
            </defs>
            
            <path
              d="M 125,21 C 133.332,17.4017 138.004,10.8076 140,2 C 131.768,4.80043 126.623,12.7823 125,21 M 121,9 C 115.423,14.8743 109.344,21.3927 111,30 C 116.736,25.9224 123.654,16.4819 121,9 M 105,17 C 99.4877,23.3758 96.0764,29.4521 96,38 C 102.695,34.4163 108.138,24.5495 105,17 M 91,22 C 86.9367,28.7251 80.7286,35.7187 83,44 C 89.5693,39.9945 94.1158,29.4955 91,22 z"
              fill="url(#leafGradientCorner)"
              stroke="none"
            />
            
            <path
              d="M 123,22 C 111.924,33.0683 94.8436,47.1444 78,46 C 73.0981,49.7183 64.0415,49.1726 58,50 C 37.7062,52.7794 14.2794,52.3969 4,74 C 12.8131,73.2993 18.6752,60.2677 28,57.3897 C 53.2896,49.5842 80.3415,54.3855 104,40.1998 C 109.807,36.718 123.162,29.6358 123,22 z"
              fill={colors.deepOlive}
              stroke="none"
            />
            
            <path
              d="M 120,32 C 128.488,31.8239 135.85,28.9759 141,22 C 132.506,22.1753 124.21,23.9759 120,32 M 110,41 C 117.984,43.968 124.524,41.0661 132,38 C 125.775,33.747 114.666,35.2613 110,41 M 93,46 C 95.8923,54.6746 110.783,52.29 118,52 L 115,46 L 93,46 z"
              fill="url(#leafGradientCorner)"
              stroke="none"
            />
          </svg>
        </div>
        
      </div>
    )
  }

  return null
}

export default OliveBranch