import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, setTokens, clearTokens, getAccessToken } from '@/lib/api'

// Types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'staff'
  permissions: {
    appointments: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    customers: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    services: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    packages: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    transactions: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    staff: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    reports: { view: boolean }
  }
  avatar?: string
}

export interface Company {
  id: string
  name: string
  businessType: 'salon' | 'barbershop' | 'spa' | 'clinic'
  subscription: {
    plan: 'trial' | 'basic' | 'premium'
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
    currentPeriodEnd?: string
    trialEnd?: string
  }
  settings: any
}

export interface AuthContextType {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { identifier: string; password: string }) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  hasPermission: (resource: string, action: string) => boolean
}

export interface RegisterData {
  email: string
  password: string
  phone: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const queryClient = useQueryClient()

  // Check if user is authenticated
  const isAuthenticated = !!user && !!getAccessToken()

  // Fetch user data if token exists
  const { isLoading: authLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: !!getAccessToken() && !user,
    retry: false, // Don't retry on failure during development
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data.user)
        setCompany(response.data.company)
      }
    },
    onError: () => {
      // Token is invalid, clear it
      clearTokens()
      setUser(null)
      setCompany(null)
    },
  })

  const login = async (credentials: { identifier: string; password: string }) => {
    try {
      const response = await authApi.login(credentials)
      
      if (response.success && response.data) {
        const { user, company, tokens } = response.data
        
        // Store tokens
        setTokens(tokens)
        
        // Set user and company data
        setUser(user)
        setCompany(company)
        
        // Invalidate and refetch queries
        queryClient.invalidateQueries()
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      throw new Error(message)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data)
      
      if (response.success && response.data) {
        const { user, company, tokens } = response.data
        
        // Store tokens
        setTokens(tokens)
        
        // Set user and company data
        setUser(user)
        setCompany(company)
        
        // Invalidate and refetch queries
        queryClient.invalidateQueries()
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed'
      throw new Error(message)
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and user data
      clearTokens()
      setUser(null)
      setCompany(null)
      
      // Clear all queries
      queryClient.clear()
      
      // Redirect to login
      window.location.href = '/login'
    }
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === 'admin') return true
    
    // Check specific permission
    const resourcePermissions = user.permissions[resource as keyof typeof user.permissions]
    if (!resourcePermissions) return false
    
    return resourcePermissions[action as keyof typeof resourcePermissions] || false
  }

  // Initialize user data on mount if token exists
  useEffect(() => {
    const token = getAccessToken()
    if (token && !user && !authLoading) {
      // The query will handle fetching user data
    }
  }, [user, authLoading])

  // Set initial loading state to false to prevent spinner from showing indefinitely
  const [isLoading, setIsLoading] = useState(false)

  const value: AuthContextType = {
    user,
    company,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
