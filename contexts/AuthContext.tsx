import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Guest = {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

type Group = {
  id: string
  name: string
  guests: Guest[]
}

type AuthContextType = {
  isAuthenticated: boolean
  group: Group | null
  currentUser: Guest | null
  login: (firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [currentUser, setCurrentUser] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const data = await response.json()
        if (data.isAuthenticated) {
          setIsAuthenticated(true)
          setGroup(data.group)
          
          // Find the current user from the group guests using session info
          if (data.session?.currentUserId && data.group?.guests) {
            const foundUser = data.group.guests.find((guest: Guest) => guest.id === data.session.currentUserId)
            setCurrentUser(foundUser || null)
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (firstName: string, lastName: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName }),
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        setGroup(data.group)
        
        // Find the current user (the one who just logged in)
        if (data.group?.guests) {
          const foundUser = data.group.guests.find((guest: Guest) => 
            guest.first_name.toLowerCase() === firstName.trim().toLowerCase() &&
            guest.last_name.toLowerCase() === lastName.trim().toLowerCase()
          )
          setCurrentUser(foundUser || null)
        }
      }

      return {
        success: data.success,
        message: data.message
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection error'
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setGroup(null)
      setCurrentUser(null)
    }
  }

  const value = {
    isAuthenticated,
    group,
    currentUser,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}