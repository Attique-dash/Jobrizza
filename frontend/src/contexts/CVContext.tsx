'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './Authcontext'

interface CVData {
  filename: string
  name: string | null
  email: string | null
  phone: string | null
  skills: string[]
  education: string[]
  experience: string[]
  raw_text: string
  word_count?: number
  analysis?: any
  ai_analysis?: any
}

interface CVContextType {
  cvData: CVData | null
  loading: boolean
  refreshCVData: () => void
}

const CVContext = createContext<CVContextType>({
  cvData: null,
  loading: true,
  refreshCVData: () => {},
})

export function CVProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCVData = () => {
    if (typeof window === 'undefined') return
    
    const stored = sessionStorage.getItem('cvData')
    if (stored) {
      try {
        setCvData(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse CV data:', e)
        setCvData(null)
      }
    } else {
      setCvData(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/cv-result')
      return
    }
    loadCVData()
  }, [isAuthenticated, router])

  const refreshCVData = () => {
    setLoading(true)
    loadCVData()
  }

  return (
    <CVContext.Provider value={{ cvData, loading, refreshCVData }}>
      {children}
    </CVContext.Provider>
  )
}

export const useCV = () => {
  const context = useContext(CVContext)
  if (context === undefined) {
    throw new Error('useCV must be used within CVProvider')
  }
  return context
}

export function useCVOrRedirect() {
  const { cvData, loading } = useCV()
  const { isDark } = useTheme()
  
  if (loading) {
    return {
      cvData: null,
      content: (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
          <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ),
    }
  }

  if (!cvData) {
    return {
      cvData: null,
      content: (
        <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <div className="text-6xl">📄</div>
          <h1 className="text-2xl font-bold">No CV Data Found</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Upload a CV first to see your analysis.</p>
          <a href="/" className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold transition-colors">
            ← Upload CV
          </a>
        </div>
      ),
    }
  }

  return { cvData, content: null }
}

// Import useTheme at the bottom to avoid circular issues
import { useTheme } from './Themecontext'
