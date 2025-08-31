import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'fr'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  userLanguage?: string // The current user's preferred language (can be any language)
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
  const [userLanguage, setUserLanguage] = useState<string>()
  const [isClient, setIsClient] = useState(false)
  
  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Check for user language preference when on client side (one-time only)
  useEffect(() => {
    if (!isClient) return
    
    const checkUserLanguage = async () => {
      try {
        const response = await fetch('/api/auth/status')
        if (response.ok) {
          const data = await response.json()
          if (data.isAuthenticated && data.session) {
            // Use userLanguage with fallback to groupLanguage for backward compatibility
            const userLang = data.session.userLanguage || data.session.groupLanguage
            setUserLanguage(userLang)
            
            // Simple UI logic: French if user language is "French", otherwise English
            const uiLanguage = userLang?.toLowerCase() === 'french' ? 'fr' : 'en'
            setLanguage(uiLanguage)
          }
        }
      } catch (error) {
        console.error('Error checking user language:', error)
      }
    }
    
    // Only check once when component mounts - no polling
    checkUserLanguage()
  }, [isClient])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, userLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}