'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'

export interface User {
  id: string
  name: string
  email: string
  userType: 'candidate' | 'company'
  avatar?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, userType: 'candidate' | 'company') => Promise<void>
  register: (name: string, email: string, password: string, userType: 'candidate' | 'company') => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const loading = status === 'loading'

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        userType: session.user.userType as 'candidate' | 'company',
        avatar: session.user.avatar,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async (email: string, password: string, userType: 'candidate' | 'company') => {
    // First, authenticate with Flask backend to get token
    const flaskRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType }),
    })
    
    const flaskData = await flaskRes.json()
    if (!flaskRes.ok) {
      throw new Error(flaskData.error || 'Login failed')
    }
    
    // Store Flask token in sessionStorage for API calls
    if (typeof window !== 'undefined' && flaskData.token) {
      sessionStorage.setItem('token', flaskData.token)
    }
    
    // Then authenticate with NextAuth for session management
    const result = await signIn('credentials', {
      email,
      password,
      userType,
      redirect: false,
    })

    if (result?.error) {
      throw new Error(result.error)
    }
  }

  const register = async (name: string, email: string, password: string, userType: 'candidate' | 'company') => {
    // Register with Flask backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, userType }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')

    // Store Flask token if provided
    if (typeof window !== 'undefined' && data.token) {
      sessionStorage.setItem('token', data.token)
    }

    // Auto login with NextAuth after registration
    await login(email, password, userType)
  }

  const logout = () => {
    // Clear Flask token from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token')
    }
    signOut({ callbackUrl: '/' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  // Safety check: AuthContext must be inside SessionProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider, and AuthProvider must be wrapped in SessionProvider')
  }
  return context
}