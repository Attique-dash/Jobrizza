'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  userType: 'candidate' | 'company'
  avatar?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string, userType: 'candidate' | 'company') => Promise<void>
  register: (name: string, email: string, password: string, userType: 'candidate' | 'company') => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
})

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    try {
      const storedToken = localStorage.getItem('jobrizza-token')
      const storedUser = localStorage.getItem('jobrizza-user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error('Failed to restore session', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, userType: 'candidate' | 'company') => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    persist(data.token, data.user)
  }

  const register = async (name: string, email: string, password: string, userType: 'candidate' | 'company') => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, userType }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    persist(data.token, data.user)
  }

  const persist = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('jobrizza-token', newToken)
    localStorage.setItem('jobrizza-user', JSON.stringify(newUser))
    // Set cookie for middleware
    document.cookie = `jobrizza-token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`
    document.cookie = `userType=${newUser.userType}; path=/; max-age=${7 * 24 * 60 * 60}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('jobrizza-token')
    localStorage.removeItem('jobrizza-user')
    document.cookie = 'jobrizza-token=; path=/; max-age=0'
    document.cookie = 'userType=; path=/; max-age=0'
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)