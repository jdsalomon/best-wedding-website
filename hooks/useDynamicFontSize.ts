import { useState, useEffect, useRef, useCallback } from 'react'

interface DynamicFontSizeProps {
  text: string
  fontFamily: string
  fontWeight: number
  letterSpacing: string
  minSize?: number
  maxSize?: number
  buttonWidth: number
  gapWidth?: number
}

export const useDynamicFontSize = ({
  text,
  fontFamily,
  fontWeight,
  letterSpacing,
  minSize = 8,
  maxSize = 20,
  buttonWidth,
  gapWidth = 16 // 1rem default gap
}: DynamicFontSizeProps) => {
  const [fontSize, setFontSize] = useState(maxSize)
  const containerRef = useRef<HTMLDivElement>(null)

  // Measure text width using canvas for accuracy
  const measureText = useCallback((text: string, size: number): number => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    // Apply exact font properties
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`

    // Get base width
    let width = ctx.measureText(text).width

    // Add letter spacing compensation
    if (letterSpacing === '0.15em') {
      width += (0.15 * size * (text.length - 1))
    }

    return width
  }, [fontFamily, fontWeight, letterSpacing])

  // More precise font size calculation
  const calculateFontSize = useCallback((availableWidth: number) => {
    // Start from maximum and work down with finer precision
    for (let size = maxSize; size >= minSize; size -= 0.01) {
      const textWidth = measureText(text, size)

      if (textWidth <= availableWidth * 0.95) { // Use 95% to be conservative
        return Math.round(size * 100) / 100 // Round to 2 decimal places
      }
    }

    return minSize
  }, [text, measureText, minSize, maxSize])

  // ResizeObserver for efficient container size tracking
  useEffect(() => {
    if (!containerRef.current || buttonWidth === 0) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width
        const reservedSpace = buttonWidth + gapWidth + 20 // Extra safety margin
        const availableWidth = containerWidth - reservedSpace

        if (availableWidth > 0) {
          const newSize = calculateFontSize(availableWidth)
          setFontSize(newSize)
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [calculateFontSize, buttonWidth, gapWidth])

  return {
    fontSize: `${fontSize}px`,
    containerRef
  }
}