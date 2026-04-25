'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './Authcontext'
import { fetchWithAuth } from '@/lib/api'

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

  const loadCVData = async () => {
    if (typeof window === 'undefined') return
    
    try {
      const res = await fetchWithAuth('/api/cv-data/latest')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.cv_data) {
          setCvData(data.cv_data)
        } else {
          setCvData(null)
        }
      } else {
        setCvData(null)
      }
    } catch (error) {
      console.error('Failed to fetch CV data:', error)
      setCvData(null)
    } finally {
      setLoading(false)
    }
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
