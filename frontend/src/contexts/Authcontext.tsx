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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, userType }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')

    // Auto login after registration
    await login(email, password, userType)
  }

  const logout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)