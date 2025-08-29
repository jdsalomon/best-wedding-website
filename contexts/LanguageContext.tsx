import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'fr'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  groupLanguage?: string // The actual group language string (can be any language)
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguageContext = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('fr') // Default to French
  const [groupLanguage, setGroupLanguage] = useState<string>()
  const [isClient, setIsClient] = useState(false)
  
  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Check for group language preference when on client side (one-time only)
  useEffect(() => {
    if (!isClient) return
    
    const checkGroupLanguage = async () => {
      try {
        const response = await fetch('/api/auth/status')
        if (response.ok) {
          const data = await response.json()
          if (data.isAuthenticated && data.session?.groupLanguage) {
            const groupLang = data.session.groupLanguage
            setGroupLanguage(groupLang)
            
            // Simple UI logic: French if group language is "French", otherwise English
            const uiLanguage = groupLang?.toLowerCase() === 'french' ? 'fr' : 'en'
            setLanguage(uiLanguage)
          }
        }
      } catch (error) {
        console.error('Error checking group language:', error)
      }
    }
    
    // Only check once when component mounts - no polling
    checkGroupLanguage()
  }, [isClient])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, groupLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}